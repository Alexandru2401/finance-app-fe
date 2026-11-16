import { del, get, post } from "./client";
import type { RoadmapItemId } from "@/components/public/data/RoadmapItems";

export type RoadmapVote = {
  item_id: RoadmapItemId;
  count: number;
  // Dacă userul curent a votat; false pentru vizitatorii neautentificați
  voted: boolean;
};

type VoteResponse = { success?: boolean; count: number };

export function getRoadmapVotes() {
  return get<{ success?: boolean; votes: RoadmapVote[] }>("/roadmap/votes");
}

export function addRoadmapVote(id: RoadmapItemId) {
  return post<VoteResponse>(`/roadmap/${id}/vote`, {});
}

export function removeRoadmapVote(id: RoadmapItemId) {
  return del<VoteResponse>(`/roadmap/${id}/vote`);
}
