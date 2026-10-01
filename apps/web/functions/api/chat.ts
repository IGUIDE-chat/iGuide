// Temporary shim: iguide.chat is still served by the `web` Pages project, which
// only runs Pages Functions. Re-export the Worker route until the Worker cutover.
export { onRequestPost } from "../../worker/routes/chat"
