/**
 * Chat renderer id shared by the artifact actions (server) and the
 * transcript card registration (client, app/components/chat/ArtifactFileCard).
 *
 * A custom id is required: the builtin `core.workspace-file` renderer always
 * wins over app registrations, so pointing chatUI at it would render the
 * download-only core card instead of ours.
 */
export const ARTIFACT_FILE_RENDERER = "chat.artifact-file";
