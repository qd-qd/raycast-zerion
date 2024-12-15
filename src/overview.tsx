import { open } from "@raycast/api";
import type { LaunchProps } from "@raycast/api";

export default function Overview(props: LaunchProps<{ arguments: Arguments.Overview }>) {
  return open(`https://app.zerion.io/${props.arguments.account}/overview`);
}
