const votes: Record<string, number> = {};

export function saveVote(participant: string) {
  votes[participant] = (votes[participant] || 0) + 1;
}

export function getVotes() {
  return votes;
}
