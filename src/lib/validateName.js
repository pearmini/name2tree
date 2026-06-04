import {Filter} from "bad-words";

const filter = new Filter();

const URL_RE = /https?:\/\/|www\./i;
const EMAIL_RE = /@.+\./i;
const MAX_LENGTH = 80;

export function validateName(raw) {
  const name = raw.trim();
  if (!name) {
    return {ok: false, error: "Please enter a name or short text."};
  }
  if (name.length > MAX_LENGTH) {
    return {ok: false, error: `Please keep it under ${MAX_LENGTH} characters.`};
  }
  if (URL_RE.test(name) || EMAIL_RE.test(name)) {
    return {ok: false, error: "Please use a friendly name without links or email."};
  }
  if (filter.isProfane(name)) {
    return {ok: false, error: "Please use friendly words only."};
  }
  return {ok: true, name};
}
