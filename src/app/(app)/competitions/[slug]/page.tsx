import { redirect } from "next/navigation";

export default async function CompetitionRootPage(
  props: PageProps<"/competitions/[slug]">
) {
  const { slug } = await props.params;
  redirect(`/competitions/${slug}/bracket`);
}
