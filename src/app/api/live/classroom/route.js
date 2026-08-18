import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { redisGet, redisSet, redisDel } from '@/utils/redis'
import { getCorsHeaders } from '@/utils/security'

function corsResponse(request, response) {
  const headers = getCorsHeaders(request)
  Object.entries(headers).forEach(([key, val]) => {
    response.headers.set(key, val)
  })
  return response
}

// Module-level in-memory state tracking to simulate high-throughput cohort classroom overlay
// Real-world clusters would use Upstash Redis, but this establishes local in-memory isolation for rate limits and active polls
const rateLimitMap = new Map()
const pollVotesMap = new Map() // pollId -> Set of userIds who voted
const pollResultsMap = new Map() // pollId -> { optionIndex: voteCount }

// Helper to secure rate-limiting
function checkRateLimit(userId) {
  const now = Date.now()
  const lastActive = rateLimitMap.get(userId)
  if (lastActive && now - lastActive < 3000) {
    return false
  }
  rateLimitMap.set(userId, now)
  return true
}

async function baseGET(request) {
  try {
    const supabase = await createClient()

    // 1. Zero-Trust Security: Authenticate user cryptographically using getUser()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid session' },
        { status: 401 }
      )
    }

    const now = Date.now()

    // A. Check if dynamic custom instructor poll is active in Upstash Redis
    const customPoll = await redisGet('asentra:live:poll');
    if (customPoll) {
      const results = await redisGet('asentra:live:poll:results') || { 0: 0, 1: 0, 2: 0, 3: 0 };
      const votesList = await redisGet('asentra:live:poll:votes') || [];
      const hasVoted = votesList.includes(user.id);
      const totalVotes = Object.values(results).reduce((a, b) => a + b, 0);

      return NextResponse.json({
        classroomState: {
          activeCohort: 'ASENTRA-Beta-Cohort-2026',
          activeUsersCount: Math.floor(Math.random() * 42) + 180,
          livePoll: {
            id: customPoll.id,
            question: customPoll.question,
            options: customPoll.options,
            expiresAt: customPoll.expiresAt,
            timeLeftSeconds: Math.max(0, Math.floor((customPoll.expiresAt - now) / 1000)),
            hasVoted,
            totalVotes,
            results
          }
        }
      });
    }
    const secondsInMinute = new Date(now).getSeconds()
    const pollCycleSeconds = 30
    const currentCycleStart = now - (secondsInMinute % pollCycleSeconds) * 1000
    const expiresAt = currentCycleStart + pollCycleSeconds * 1000

    // Dynamic mock poll question pool rotated based on system hour & minute cycle
    const pollPool = [
      {
        id: `poll-${Math.floor(currentCycleStart / 30000)}-1`,
        question: 'Which sorting algorithm has a worst-case time complexity of O(n log n)?',
        options: ['Bubble Sort', 'Merge Sort', 'Quick Sort', 'Selection Sort']
      },
      {
        id: `poll-${Math.floor(currentCycleStart / 30000)}-2`,
        question: 'In JavaScript, which keyword declares a block-scoped variable?',
        options: ['var', 'let', 'const', 'Both let and const']
      },
      {
        id: `poll-${Math.floor(currentCycleStart / 30000)}-3`,
        question: 'What is the primary function of a Progressive Web App service worker?',
        options: ['Database Queries', 'Asset Caching & Offline Support', 'CSS Grid layouts', 'Video Transcoding']
      }
    ]

    const selectedPollIdx = Math.floor((currentCycleStart / 30000) % pollPool.length)
    const currentPoll = pollPool[selectedPollIdx]

    // Populate mock initial votes if none exist yet for this cycle
    if (!pollResultsMap.has(currentPoll.id)) {
      pollResultsMap.set(currentPoll.id, {
        0: Math.floor(Math.random() * 15) + 5,
        1: Math.floor(Math.random() * 45) + 30,
        2: Math.floor(Math.random() * 25) + 15,
        3: Math.floor(Math.random() * 10) + 2
      })
      pollVotesMap.set(currentPoll.id, new Set())
    }

    const currentResults = pollResultsMap.get(currentPoll.id)
    const hasVoted = pollVotesMap.get(currentPoll.id)?.has(user.id) || false

    const totalVotes = Object.values(currentResults).reduce((a, b) => a + b, 0)

    return NextResponse.json({
      classroomState: {
        activeCohort: 'ASENTRA-Beta-Cohort-2026',
        activeUsersCount: Math.floor(Math.random() * 42) + 180, // Dynamic active user analytics
        livePoll: {
          ...currentPoll,
          expiresAt,
          timeLeftSeconds: Math.max(0, Math.floor((expiresAt - now) / 1000)),
          hasVoted,
          totalVotes,
          results: currentResults
        }
      }
    })
  } catch (err) {
    console.error('Classroom sync gateway exception (GET):', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

async function basePOST(request) {
  try {
    const supabase = await createClient()

    // 1. Zero-Trust Security: Authenticate user cryptographically using getUser()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid session' },
        { status: 401 }
      )
    }

    // 2. High-Throughput 3-Second Rate Limiting Block
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Too Many Requests: Dynamic rate limiting blocks spam. Please wait 3 seconds.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { action, pollId, optionIndex, lessonId, content } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Missing parameter: action' },
        { status: 400 }
      )
    }

    // Handle Poll Response Action
    if (action === 'submit_poll') {
      if (!pollId || optionIndex === undefined) {
        return NextResponse.json(
          { error: 'Missing required params: pollId and optionIndex' },
          { status: 400 }
        )
      }

      // If it is a custom poll, record and check votes in Redis
      if (pollId.startsWith('poll-custom-')) {
        const customPoll = await redisGet('asentra:live:poll');
        if (!customPoll || customPoll.id !== pollId) {
          return NextResponse.json(
            { error: 'Poll session expired or inactive' },
            { status: 404 }
          )
        }

        const votesList = await redisGet('asentra:live:poll:votes') || [];
        if (votesList.includes(user.id)) {
          return NextResponse.json(
            { error: 'Forbidden: You have already submitted a vote for this poll cycle' },
            { status: 403 }
          )
        }

        votesList.push(user.id);
        await redisSet('asentra:live:poll:votes', votesList, { ex: customPoll.durationSeconds + 120 });

        const results = await redisGet('asentra:live:poll:results') || { 0: 0, 1: 0, 2: 0, 3: 0 };
        results[optionIndex] = (results[optionIndex] || 0) + 1;
        await redisSet('asentra:live:poll:results', results, { ex: customPoll.durationSeconds + 300 });

        const totalVotes = Object.values(results).reduce((a, b) => a + b, 0);

        return NextResponse.json({
          success: true,
          message: 'Vote recorded successfully',
          livePoll: {
            id: pollId,
            hasVoted: true,
            totalVotes,
            results
          }
        });
      }

      // Fallback: Check if user already voted in standard in-memory cycle mock poll
      const votesSet = pollVotesMap.get(pollId)
      if (!votesSet) {
        return NextResponse.json(
          { error: 'Poll session expired or inactive' },
          { status: 404 }
        )
      }

      if (votesSet.has(user.id)) {
        return NextResponse.json(
          { error: 'Forbidden: You have already submitted a vote for this poll cycle' },
          { status: 403 }
        )
      }

      // Record vote
      votesSet.add(user.id)
      const currentResults = pollResultsMap.get(pollId) || { 0: 0, 1: 0, 2: 0, 3: 0 }
      currentResults[optionIndex] = (currentResults[optionIndex] || 0) + 1
      pollResultsMap.set(pollId, currentResults)

      const totalVotes = Object.values(currentResults).reduce((a, b) => a + b, 0)

      return NextResponse.json({
        success: true,
        message: 'Vote recorded successfully',
        livePoll: {
          id: pollId,
          hasVoted: true,
          totalVotes,
          results: currentResults
        }
      })
    }

    // Handle Doubt Submit Action (bypassing normal doubt route for synchronized classrooms)
    if (action === 'submit_doubt') {
      if (!lessonId || !content || !content.trim()) {
        return NextResponse.json(
          { error: 'Missing required params: lessonId and content' },
          { status: 400 }
        )
      }

      const { data, error } = await supabase
        .from('lesson_doubts')
        .insert({
          lesson_id: lessonId,
          user_id: user.id,
          content: content.trim()
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase doubt insertion error in classroom sync:', error)
        return NextResponse.json(
          { error: 'Database write failed: ' + error.message },
          { status: 500 }
        )
      }

      // Fetch user profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle()

      return NextResponse.json({
        success: true,
        doubt: {
          ...data,
          profiles: profile || { full_name: user.email?.split('@')[0] || 'Student', email: user.email }
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid classroom action request' },
      { status: 400 }
    )
  } catch (err) {
    console.error('Classroom sync gateway exception (POST):', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request) {
  return NextResponse.json({}, { headers: getCorsHeaders(request) })
}

export async function GET(request) {
  const response = await baseGET(request)
  return corsResponse(request, response)
}

export async function POST(request) {
  const response = await basePOST(request)
  return corsResponse(request, response)
}
