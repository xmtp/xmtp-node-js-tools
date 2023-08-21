import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1692633083049 implements MigrationInterface {
    name = 'Init1692633083049'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "conversation" ("id" SERIAL NOT NULL, "peerAddress" character varying NOT NULL, "topic" character varying NOT NULL, "state" json NOT NULL DEFAULT '{}', "botId" character varying, CONSTRAINT "PK_864528ec4274360a40f66c29845" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9a7cd4280c48d061b0e0c8bfd3" ON "conversation" ("botId", "topic") `);
        await queryRunner.query(`CREATE TABLE "bot" ("id" character varying NOT NULL, "state" json NOT NULL DEFAULT '{}', CONSTRAINT "PK_bc6d59d7870eb2efd5f7f61e5ca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "inbound_message" ("id" SERIAL NOT NULL, "messageId" character varying NOT NULL, "contents" bytea NOT NULL, "status" character varying NOT NULL DEFAULT 'unprocessed', "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "numRetries" integer NOT NULL DEFAULT '0', "botId" character varying, "conversationId" integer, CONSTRAINT "PK_a013d32c89ba79e84f4d371bd1b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_779a4aeb4282462e24413c9cad" ON "inbound_message" ("botId", "messageId") `);
        await queryRunner.query(`CREATE TABLE "reply" ("id" SERIAL NOT NULL, "messageId" character varying NOT NULL, "contents" bytea NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "replyToId" integer, "botId" character varying, "conversationId" integer, CONSTRAINT "PK_94fa9017051b40a71e000a2aff9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fba42d1762705e71c4944a2f54" ON "reply" ("botId", "messageId") `);
        await queryRunner.query(`CREATE TABLE "key_value" ("key" character varying NOT NULL, "value" bytea NOT NULL, CONSTRAINT "PK_f0f311dbd493bba26c68c4d3540" PRIMARY KEY ("key"))`);
        await queryRunner.query(`ALTER TABLE "conversation" ADD CONSTRAINT "FK_34f0c9e33195e363cd90cef5a19" FOREIGN KEY ("botId") REFERENCES "bot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inbound_message" ADD CONSTRAINT "FK_a31d9d66b7f963cd21d96247488" FOREIGN KEY ("botId") REFERENCES "bot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inbound_message" ADD CONSTRAINT "FK_32044181c698ffa93ae5a2d6c2c" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reply" ADD CONSTRAINT "FK_6c074db07fb7357091a92f4ea0a" FOREIGN KEY ("replyToId") REFERENCES "inbound_message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reply" ADD CONSTRAINT "FK_492cb279edd32603d3d47d33e57" FOREIGN KEY ("botId") REFERENCES "bot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reply" ADD CONSTRAINT "FK_a22998750a71629395fd0ad57c4" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reply" DROP CONSTRAINT "FK_a22998750a71629395fd0ad57c4"`);
        await queryRunner.query(`ALTER TABLE "reply" DROP CONSTRAINT "FK_492cb279edd32603d3d47d33e57"`);
        await queryRunner.query(`ALTER TABLE "reply" DROP CONSTRAINT "FK_6c074db07fb7357091a92f4ea0a"`);
        await queryRunner.query(`ALTER TABLE "inbound_message" DROP CONSTRAINT "FK_32044181c698ffa93ae5a2d6c2c"`);
        await queryRunner.query(`ALTER TABLE "inbound_message" DROP CONSTRAINT "FK_a31d9d66b7f963cd21d96247488"`);
        await queryRunner.query(`ALTER TABLE "conversation" DROP CONSTRAINT "FK_34f0c9e33195e363cd90cef5a19"`);
        await queryRunner.query(`DROP TABLE "key_value"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fba42d1762705e71c4944a2f54"`);
        await queryRunner.query(`DROP TABLE "reply"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_779a4aeb4282462e24413c9cad"`);
        await queryRunner.query(`DROP TABLE "inbound_message"`);
        await queryRunner.query(`DROP TABLE "bot"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9a7cd4280c48d061b0e0c8bfd3"`);
        await queryRunner.query(`DROP TABLE "conversation"`);
    }

}
