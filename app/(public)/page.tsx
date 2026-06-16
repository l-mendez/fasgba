import {
  HomeClubsSection,
  HomeFaqSection,
  HomeNewsSection,
  HomeSectionDivider,
  HomeTournamentsSection,
} from "@/components/home"
import { getHomePageData } from "@/lib/homeUtils"

export const revalidate = 300

export default async function Home() {
  const { news, tournaments, clubs } = await getHomePageData()

  return (
    <>
      <HomeNewsSection news={news} />
      <HomeSectionDivider />

      <HomeTournamentsSection tournaments={tournaments} />
      <HomeSectionDivider />

      <HomeClubsSection clubs={clubs} />
      <HomeSectionDivider />

      <HomeFaqSection />
    </>
  )
}
