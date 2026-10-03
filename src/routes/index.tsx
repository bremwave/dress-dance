import { createFileRoute } from "@tanstack/react-router";
import { GarmentRail } from "@/components/GarmentRail";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Kachi Editions — Garment Rail" },
      { name: "description", content: "Explore the Kachi Editions capsule collection on an interactive garment rail." },
      { property: "og:title", content: "Kachi Editions — Garment Rail" },
      { property: "og:description", content: "An interactive collection of limited studio garments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <GarmentRail />;
}
