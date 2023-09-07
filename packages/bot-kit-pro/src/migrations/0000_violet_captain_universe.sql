CREATE TABLE IF NOT EXISTS "bots" (
	"id" text PRIMARY KEY NOT NULL,
	"state" json DEFAULT '{}'::json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"peer_address" text NOT NULL,
	"topic" text NOT NULL,
	"bot_id" text NOT NULL,
	"state" json DEFAULT '{}'::json NOT NULL,
	CONSTRAINT "conversations_bot_id_topic_unique" UNIQUE("bot_id","topic")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "key_value" (
	"key" text PRIMARY KEY NOT NULL,
	"value" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"contents" "bytea" NOT NULL,
	"status" text DEFAULT 'unprocessed' NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"num_retries" integer DEFAULT 0 NOT NULL,
	"bot_id" text NOT NULL,
	"conversation_id" integer NOT NULL,
	"reply_to_id" integer,
	CONSTRAINT "messages_bot_id_message_id_unique" UNIQUE("bot_id","message_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversations" ADD CONSTRAINT "conversations_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
