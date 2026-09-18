import { createFileRoute } from "@tanstack/react-router";
import { PhotoBooth } from "@/components/photo-booth";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <PhotoBooth />;
}
