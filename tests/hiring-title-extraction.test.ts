import assert from "node:assert/strict";
import test from "node:test";

import * as webHelpers from "../functions/lib/crawlers/web-helpers.js";

const { extractWebItems, isConcreteHiringUrl } = webHelpers;

test("extractWebItems prefers actual role titles for hiring pages", () => {
  const html = `
    <main>
      <div class="job-card">
        <h3>Senior Protocol Engineer</h3>
        <p>Remote</p>
        <a href="https://jobs.lever.co/example/12345678-1234-1234-1234-123456789abc">Apply Now</a>
      </div>
    </main>
  `;

  const items = extractWebItems({
    html,
    sourceUrl: "https://careers.example.com",
    selector: ".job-card",
    sourceType: "hiring",
  });

  assert.equal(items[0]?.title, "Senior Protocol Engineer");
});

test("extractWebItems skips generic hiring board links with no title context", () => {
  const html = `
    <main>
      <a href="https://jobs.example.com/open-roles">View Open Positions</a>
    </main>
  `;

  const items = extractWebItems({
    html,
    sourceUrl: "https://careers.example.com",
    selector: "a[href]",
    sourceType: "hiring",
  });

  assert.equal(items.length, 0);
});

test("extractWebItems reads role titles from Gauntlet-style job cards", () => {
  const html = `
    <main>
      <div class="career_roles_item">
        <div class="career_roles_item_column gap-1">
          <div class="career_roles_item_row gap-1">
            <div fs-cmsfilter-field="role" class="heading-style-sh2">Head of Talent</div>
            <div class="career_roles_tag"><div fs-cmsfilter-field="team">Operations</div></div>
          </div>
          <p fs-cmsfilter-field="description" class="text-size-small">
            Drive recruiting strategy to find top crypto talent.
          </p>
        </div>
        <div class="career_roles_item_column is-buttons">
          <a href="https://jobs.lever.co/gauntlet/e950c88c-eeff-4a7b-aba9-8f812f03c0c9">Apply Now</a>
          <a href="https://jobs.lever.co/gauntlet/e950c88c-eeff-4a7b-aba9-8f812f03c0c9">View Full Description</a>
        </div>
      </div>
    </main>
  `;

  const items = extractWebItems({
    html,
    sourceUrl: "https://www.gauntlet.xyz/careers",
    selector: ".career_roles_item",
    sourceType: "hiring",
  });

  assert.equal(items.length, 1);
  assert.equal(items[0]?.title, "Head of Talent");
});

test("isConcreteHiringUrl accepts concrete role urls only", () => {
  assert.equal(
    isConcreteHiringUrl("https://jobs.lever.co/gauntlet/e950c88c-eeff-4a7b-aba9-8f812f03c0c9"),
    true,
  );
  assert.equal(
    isConcreteHiringUrl("https://job-boards.greenhouse.io/figment/jobs/5826618004"),
    true,
  );
  assert.equal(
    isConcreteHiringUrl("https://www.comeet.com/jobs/chaoslabs/E8.007/ai-engineer/84.568"),
    true,
  );
  assert.equal(
    isConcreteHiringUrl("https://www.figment.io/company/about/"),
    false,
  );
  assert.equal(
    isConcreteHiringUrl("https://job-boards.greenhouse.io/figment"),
    false,
  );
  assert.equal(
    isConcreteHiringUrl("https://jobs.ashbyhq.com/blockdaemon/embed"),
    false,
  );
});
