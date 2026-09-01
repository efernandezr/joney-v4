import { getConfiguredAppBasePath } from "@agent-native/core/server";
import { withSsrHtmlContentType } from "@agent-native/core/shared";
import { redirect } from "react-router";

import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [
    { title: APP_TITLE },
    {
      name: "description",
      content:
        "Redirect to the task list home for this agent-native tasks app.",
    },
  ];
}

export function loader() {
  // Under a workspace mount the app's own base path IS "/tasks", and the
  // gateway's Location-prefix rewrite treats a bare "/tasks" as already
  // prefixed — an infinite redirect loop. Emit the fully-prefixed path.
  return withSsrHtmlContentType(
    redirect(`${getConfiguredAppBasePath()}/tasks`),
  );
}

export default function IndexRedirect() {
  return null;
}
