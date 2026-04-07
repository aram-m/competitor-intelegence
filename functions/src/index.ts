import * as admin from "firebase-admin";

admin.initializeApp();

// Scheduled functions will be exported here as they're built
export { scheduledCrawl, triggerCrawl } from "./scheduled/crawl";
