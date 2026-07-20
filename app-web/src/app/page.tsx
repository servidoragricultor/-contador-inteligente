import { redirect } from "next/navigation";
import { login, registerAccountant } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/empresas");
  }

  return (
    <main className="calm-page min-h-screen px-4 py-6 sm:px-6 sm:py-10">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-2xl">
          <div className="calm-badge bg-white calm-muted ring-1 ring-slate-200">
            Contador Inteligente
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-[-0.055em] text-slate-950 sm:text-7xl">
            Contabilidad clara, sin ruido.
          </h1>
          <p className="calm-muted mt-6 max-w-xl text-lg leading-8">
            Un espacio tranquilo para que clientes capturen ingresos, gastos y XML; y el contador revise solo lo que importa.
          </p>
          <div className="calm-muted mt-10 grid max-w-xl gap-3 text-sm sm:grid-cols-3">
            <div className="calm-card p-4">Multiempresa</div>
            <div className="calm-card p-4">Captura minima</div>
            <div className="calm-card p-4">Revision clara</div>
          </div>
        </div>

        <div className="grid gap-4">
          <form action={login} className="calm-panel">
            <p className="calm-eyebrow">Acceso</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Entrar</h2>
            <p className="calm-muted mt-2 text-sm leading-6">Accede como contador o cliente. La pantalla siguiente se adapta a tu rol.</p>
            <div className="mt-6 grid gap-4">
              <input className="calm-input" name="email" type="text" placeholder="correo o usuario" required />
              <input className="calm-input" name="password" type="password" placeholder="Contrasena" required />
              <button className="calm-button-primary w-full" type="submit">Entrar</button>
            </div>
          </form>

          <form action={registerAccountant} className="calm-card p-6">
            <p className="calm-eyebrow">Nuevo despacho</p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em]">Crear cuenta contador</h2>
            <p className="calm-muted mt-2 text-sm leading-6">Crea tu espacio para administrar clientes.</p>
            <div className="mt-6 grid gap-4">
              <input className="calm-input" name="name" placeholder="Nombre" required />
              <input className="calm-input" name="email" type="email" placeholder="correo@despacho.com" required />
              <input className="calm-input" name="password" type="password" placeholder="Minimo 6 caracteres" required />
              <button className="calm-button-secondary w-full" type="submit">Crear cuenta</button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
