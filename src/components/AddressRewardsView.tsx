import { Color, Icon, Image, List } from "@raycast/api";
import { WalletMetadata } from "../shared/types";
import { AddressLine } from "./AddressLine";
import { getFullPositionsValue, getSignificantValue } from "../shared/utils";
import { useRewardsStatistics } from "../shared/useWalletRewardsStats";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import { useWalletPortfolio } from "../shared/useWalletPortfolio";
import { ZERO_CHAIN_CONFIG } from "../shared/constants";
import { useWalletPositions } from "../shared/useWalletPositions";
import { useMemo } from "react";

dayjs.extend(updateLocale);
dayjs.extend(relativeTime);

dayjs.updateLocale("en", {
  relativeTime: {
    future: "In %s",
    past: "%s ago",
    s: "A few seconds",
    m: "1 Minute",
    mm: "%d Minutes",
    h: "1 Hour",
    hh: "%d Hours",
    d: "1 Day",
    dd: "%d Days",
    M: "1 Month",
    MM: "%d Months",
    y: "1 Year",
    yy: "%d Years",
  },
});

function getLevelUpTimeFormatted(timeToGo: string) {
  return dayjs(timeToGo).fromNow(true);
}

const SECONDS_IN_DAY = 86400;

function formatXP(xp: number) {
  if (xp < 100) {
    const roundedValue = xp.toFixed(1);
    return roundedValue.at(-1) === "0" ? xp.toFixed(0) : roundedValue;
  }
  if (xp < 10000) {
    return Math.round(xp).toString();
  }
  const [significantValue, symbol] = getSignificantValue(xp);
  const roundedValue = significantValue.toFixed(1);
  const trimmedValue = roundedValue.at(-1) === "0" ? significantValue.toFixed(0) : roundedValue;
  return `${trimmedValue}${symbol}`;
}

export function AddressRewardsView({ address, walletMeta }: { address: string; walletMeta: WalletMetadata }) {
  const { stats } = useRewardsStatistics({ address });
  const { portfolio } = useWalletPortfolio({ address });
  const { positions } = useWalletPositions({ address });

  const boosts = useMemo(() => {
    if (!stats || !positions) {
      return [];
    }
    return stats.boosts.map((boost) => {
      return {
        boost,
        positions: positions.filter((position) => position.asset.id === boost.asset),
        asset: positions.find((position) => position.asset.id === boost.asset)?.asset,
      };
    });
  }, [stats, positions]);

  const levelCapacity = walletMeta.membership.levelCapacity;
  const levelProgress = (walletMeta.membership.levelCapacity * walletMeta.membership.levelProgressPercentage) / 100;
  const activeXpEarned = Math.floor(walletMeta?.membership.levelFarmingIndex || 0);
  const passiveXpEarned = Math.max(
    (levelCapacity * walletMeta.membership.levelProgressPercentage) / 100 - activeXpEarned,
    0,
  );
  const activeXpLimit = Math.floor(walletMeta?.membership.levelFarmingLimit || 0);
  const actualActiveXpLimit = Math.max(Math.min(activeXpLimit, levelCapacity - passiveXpEarned), 0);

  return (
    <List>
      <AddressLine address={address || ""} walletMetadata={walletMeta} onChangeSavedStatus={() => null} />
      <List.Item
        title="Level Progress"
        subtitle={`${walletMeta.membership.levelProgressPercentage.toFixed(1)}%`}
        accessories={[
          { tag: { value: `Next Level in ${getLevelUpTimeFormatted(walletMeta.membership.levelUpTime)}` } },
          { text: `Locked: ${formatXP(walletMeta.membership.xp.locked)} XP` },
          { text: `${formatXP(levelProgress)} / ${formatXP(levelCapacity)} XP` },
        ]}
      />
      <List.Item
        title="Activity Progress"
        subtitle={`${((activeXpEarned / actualActiveXpLimit) * 100).toFixed(1)}%`}
        accessories={[{ text: `${formatXP(activeXpEarned)} / ${formatXP(actualActiveXpLimit)} XP` }]}
      />
      <List.Item
        title="ZERO XP"
        subtitle={
          portfolio ? `$${Number(portfolio.positionsChainsDistribution[ZERO_CHAIN_CONFIG.id])?.toFixed(2)}` : undefined
        }
        accessories={[
          { text: stats ? `+${formatXP(stats.xpRate * SECONDS_IN_DAY)} XP/Day` : undefined },
          { text: `${formatXP(passiveXpEarned)} XP` },
        ]}
      />
      <List.Item
        title="Gasback"
        subtitle={stats ? `$${Number(stats.gasSpend)?.toFixed(2)}` : undefined}
        accessories={[{ text: stats ? `${formatXP(stats.gasback)} XP` : undefined }]}
      />
      <List.Section title="Referral Program">
        <List.Item
          icon={Icon.Person}
          title="Invites"
          subtitle={walletMeta ? walletMeta.membership.referred.toString() : undefined}
          accessories={[{ text: walletMeta ? `${formatXP(walletMeta.membership.xp.referred)} XP` : undefined }]}
        />
      </List.Section>
      {boosts ? (
        <List.Section title="Boosts">
          {boosts.map((boost) =>
            boost.asset ? (
              <List.Item
                key={boost.boost.asset}
                icon={{ source: boost.asset.iconUrl || Icon.Circle, mask: Image.Mask.Circle }}
                title={boost.asset.name}
                accessories={[
                  { text: { value: `$${getFullPositionsValue(boost.positions).toFixed(2)}`, color: Color.Green } },
                  { tag: { value: `${boost.boost.factor.toFixed(1)}x`, color: Color.Purple } },
                ]}
              />
            ) : null,
          )}
        </List.Section>
      ) : null}
    </List>
  );
}
