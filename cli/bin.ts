import { main } from "./index";

main().catch((err: unknown) => {
  console.error(`logodown: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
