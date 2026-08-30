/**
 * Chat renderer id shared by the propose-memory action (server) and the
 * transcript card registration (client, app/components/chat/BrainProposalCard).
 *
 * A custom id is required: the builtin renderers don't know how to surface
 * "keep"/"dismiss" review actions, so pointing chatUI at one of them would
 * render a plain result card instead of ours.
 */
export const BRAIN_PROPOSAL_RENDERER = "brain-proposal";
