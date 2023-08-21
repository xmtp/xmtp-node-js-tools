import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class KeyValue {
  @PrimaryColumn()
  key: string

  @Column({ type: "bytea" })
  value: Buffer
}
