import { Icon, LaunchProps, List, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { useWalletMetadata } from "./shared/useWalletMetadata";
import { AddressRewardsView } from "./components/AddressRewardsView";

export default function Command(props: LaunchProps) {
  const [account] = useState(props.arguments.account);
  const { isLoading, address, walletMetadata } = useWalletMetadata(account);
  if (isLoading) {
    return <List isLoading={true} filtering={false}></List>;
  }
  if (!address || !walletMetadata) {
    showToast({ style: Toast.Style.Failure, title: "Incorrect Address or Domain" });
    return (
      <List filtering={false}>
        <List.EmptyView icon={Icon.DeleteDocument} title="Incorrect Address:" description={`"${account}"`} />
      </List>
    );
  }
  return <AddressRewardsView address={address} walletMeta={walletMetadata} />;
}
