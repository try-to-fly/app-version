import got from "got";

const key = "PDU4948TCFtqSvwTei4ELEebu6gqzeqUFIObkURV";

export const notice = (text: string) => {
  return got.get(
    `https://api2.pushdeer.com/message/push?pushkey=${key}&text=${text}`,
  );
};
