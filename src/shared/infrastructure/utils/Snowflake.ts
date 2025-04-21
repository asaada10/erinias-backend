export type SnowflakeType = string & { length: 6 };
import Base62 from "./Base62";
class Snowflake {
  private static lastTimestamp = 0;
  private static sequence = 0;
  private static CUSTOM_EPOCH = new Date("2025-02-22T00:00:00Z").getTime();

  private static isValid(id: string): id is SnowflakeType {
    return /^[0-9a-zA-Z]{8}$/.test(id);
  }
  public static generate(date: Date): SnowflakeType {
    const timestamp = date.getTime() - this.CUSTOM_EPOCH;

    if (timestamp === this.lastTimestamp) {
      if (this.sequence >= 62 ** 2 - 1) {
        while (date.getTime() === this.lastTimestamp) {
          date = new Date();
        }
        this.sequence = 0;
      } else {
        this.sequence++;
      }
    } else {
      this.sequence = 0;
      this.lastTimestamp = timestamp;
    }

    const timestampEncoded = Base62.encode(timestamp)
      .padStart(6, "0")
      .slice(-6); // 6 caracteres
    const sequenceEncoded = Base62.encode(this.sequence)
      .padStart(2, "0")
      .slice(-2); // 2 caracteres

    const snowflake = timestampEncoded + sequenceEncoded;

    if (!this.isValid(snowflake)) {
      throw new Error(`Generated ID "${snowflake}" is not a valid Snowflake`);
    }

    return snowflake;
  }

  public static recoverTimestamp(userId: string): Date {
    const timestampEncoded = userId.slice(0, 4);
    const timestamp = Base62.decode(timestampEncoded) + this.CUSTOM_EPOCH;
    return new Date(timestamp);
  }
}

export default Snowflake;
