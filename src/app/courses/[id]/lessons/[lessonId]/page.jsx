import { redirect } from 'next/navigation'

export default async function LessonPage(props) {
  const params = await props.params
  const courseId = params.id
  const lessonId = params.lessonId

  // Redirect instantly to the new LMS Focus player containing Live Classes, Quizzes, and JEE Exam Center
  redirect(`/learn/${courseId}?lesson=${lessonId}`)
}

