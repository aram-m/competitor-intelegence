export type SeedSourceType = "rss" | "github" | "blog" | "hiring";

export interface CompetitorSeed {
  name: string;
  slug: string;
  category: "staking" | "vaults";
  website: string;
  logoUrl?: string;
  sources: {
    type: SeedSourceType;
    url: string;
    config?: Record<string, string>;
  }[];
}

export const COMPETITOR_SEEDS: CompetitorSeed[] = [
  {
    name: "Figment",
    slug: "figment",
    category: "staking",
    website: "https://figment.io",
    sources: [
      { type: "blog", url: "https://figment.io/blog" },
      {
        type: "github",
        url: "https://github.com/figment-networks",
        config: { githubOrg: "figment-networks" },
      },
      {
        type: "hiring",
        url: "https://job-boards.greenhouse.io/figment",
        config: { selector: "a[href*='/jobs/']" },
      },
    ],
  },
  {
    name: "Kiln",
    slug: "kiln",
    category: "staking",
    website: "https://kiln.fi",
    logoUrl:
      "https://cdn.prod.website-files.com/625db3caa8abd6c22d5f0ce3/668f029c2bb9c2f43db8fe05_Kiln%20-%20logo%20-%202024.svg",
    sources: [
      {
        type: "blog",
        url: "https://www.kiln.fi/blog",
        config: {
          selector: ".collection-list-wrapper.first-list .collection-item.w-dyn-item",
          allowedUrlPattern: "^https://www\\.kiln\\.fi/post/",
        },
      },
      {
        type: "github",
        url: "https://github.com/kilnfi",
        config: { githubOrg: "kilnfi" },
      },
      {
        type: "hiring",
        url: "https://www.kiln.fi/contact",
        config: { selector: "a[href*='jobs.ashbyhq.com'], a[href*='greenhouse.io']" },
      },
    ],
  },
  {
    name: "Blockdaemon",
    slug: "blockdaemon",
    category: "staking",
    website: "https://blockdaemon.com",
    sources: [
      { type: "blog", url: "https://blockdaemon.com/blog" },
      {
        type: "github",
        url: "https://github.com/Blockdaemon",
        config: { githubOrg: "Blockdaemon" },
      },
      {
        type: "hiring",
        url: "https://jobs.ashbyhq.com/blockdaemon/embed",
        config: { selector: "a[href*='/job/']" },
      },
    ],
  },
  {
    name: "Chorus One",
    slug: "chorus-one",
    category: "staking",
    website: "https://chorus.one",
    sources: [
      {
        type: "blog",
        url: "https://chorus.one/blog",
        config: {
          selector: ".articleslist .articleitem",
          allowedUrlPattern: "^https://chorus\\.one/articles/",
        },
      },
      {
        type: "github",
        url: "https://github.com/ChorusOne",
        config: { githubOrg: "ChorusOne" },
      },
      {
        type: "hiring",
        url: "https://chorus.one/careers",
        config: { selector: "a[href*='greenhouse.io'], a[href*='lever.co']" },
      },
    ],
  },
  {
    name: "Stakefish",
    slug: "stakefish",
    category: "staking",
    website: "https://stake.fish",
    sources: [
      { type: "blog", url: "https://stake.fish/blog" },
      {
        type: "github",
        url: "https://github.com/stakefish",
        config: { githubOrg: "stakefish" },
      },
      {
        type: "hiring",
        url: "https://stake.fish/company/jobs",
        config: { selector: "a[href*='stakefish.workable.com/jobs/']" },
      },
    ],
  },
  {
    name: "Gauntlet",
    slug: "gauntlet",
    category: "vaults",
    website: "https://gauntlet.xyz",
    sources: [
      { type: "blog", url: "https://gauntlet.xyz/blog" },
      {
        type: "github",
        url: "https://github.com/gauntlet-networks",
        config: { githubOrg: "gauntlet-networks" },
      },
      {
        type: "hiring",
        url: "https://www.gauntlet.xyz/careers",
        config: { selector: ".career_roles_item" },
      },
    ],
  },
  {
    name: "Steakhouse Financial",
    slug: "steakhouse-financial",
    category: "vaults",
    website: "https://steakhouse.financial",
    sources: [
      { type: "blog", url: "https://steakhouse.financial/blog" },
      {
        type: "github",
        url: "https://github.com/steakhouse-financial",
        config: { githubOrg: "steakhouse-financial" },
      },
      {
        type: "hiring",
        url: "https://www.steakhouse.financial/careers/general-interest",
        config: { selector: "a[href*='greenhouse.io'], a[href*='lever.co']" },
      },
    ],
  },
  {
    name: "Chaos Labs",
    slug: "chaos-labs",
    category: "vaults",
    website: "https://chaoslabs.xyz",
    sources: [
      {
        type: "blog",
        url: "https://chaoslabs.xyz/blog",
        config: {
          selector: "a[href*='/posts/']",
          allowedUrlPattern: "^https://chaoslabs\\.xyz/posts/",
        },
      },
      {
        type: "github",
        url: "https://github.com/ChaosLabsInc",
        config: { githubOrg: "ChaosLabsInc" },
      },
      {
        type: "hiring",
        url: "https://chaoslabs.xyz/careers",
        config: { selector: "a[href*='www.comeet.com/jobs/chaoslabs/']" },
      },
    ],
  },
  {
    name: "Yield.xyz",
    slug: "yield-xyz",
    category: "staking",
    website: "https://yield.xyz/",
    sources: [
      {
        type: "blog",
        url: "https://yield.xyz/blog",
        config: {
          feedUrl: "https://stakekit.ghost.io/rss/",
          allowedUrlPattern: "^https://stakekit\\.ghost\\.io/",
        },
      },
      {
        type: "github",
        url: "https://github.com/stakekit",
        config: { githubOrg: "stakekit" },
      },
    ],
  },
];
