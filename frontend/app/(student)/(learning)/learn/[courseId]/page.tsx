import LearningLayout from "@/components/learning/LearningLayout";

export default async function LearningPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <LearningLayout courseId={courseId} />;
}
