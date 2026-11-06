import { pillTone } from "@/lib/format";

export default function Pill({ category }: { category: string }) {
  return <span className={`pill ${pillTone(category)}`}>{category}</span>;
}
