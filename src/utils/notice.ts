import got from "got";

export const notice = (text: string) => {
  // get from env: PUSH_KEY
  const key = process.env.PUSH_KEY;
  if (!key) {
    return Promise.reject("PUSH_KEY is not set");
  }
  return got.get(
    `https://api2.pushdeer.com/message/push?pushkey=${key}&text=${text}`,
  );
};
