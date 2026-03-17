import Link from "next/link";

type KpiCardProps = {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  href?: string;
};

export default function KpiCard({ label, value, sub, accent, href }: KpiCardProps) {
  const card = (
    <div
      className={`bg-white rounded-xl px-5 py-5 flex flex-col gap-1 border transition-colors${href ? " hover:border-[#3D7A1C]/40 cursor-pointer" : ""}`}
      style={{ borderColor: "#E8E5DE" }}
    >
      <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#9B9488" }}>
        {label}
      </span>
      <span
        className="text-2xl font-semibold leading-tight mt-1"
        style={{ color: accent ? "#3D7A1C" : "#1A1A1A" }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-xs mt-0.5" style={{ color: "#9B9488" }}>
          {sub}
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }
  return card;
}
