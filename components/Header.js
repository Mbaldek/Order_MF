"use client";
import Link from "next/link";

export default function Header() {
  return (
    <header className="header">
      <div className="container">
        <div className="nav">
          <div className="brand">
            <div className="brandMark">M</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Maison Félicien</div>
              <div className="kicker">Commandes événement</div>
            </div>
          </div>

          <nav className="navlinks">
            <Link className="pill" href="/">Accueil</Link>
            <Link className="pill" href="/order">Commander</Link>
            <Link className="pill" href="/admin/login">Admin</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
