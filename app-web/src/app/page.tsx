import { redirect } from "next/navigation";
import { login, registerAccountant } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";

const authErrors: Record<string, string> = {
  "email-existente": "Ya existe una cuenta con ese correo.",
  login: "El usuario o la contrasena no son correctos.",
  registro: "Revisa el nombre, correo y contrasena. La contrasena debe tener al menos 6 caracteres.",
};

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  const { error } = await searchParams;

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
          {error && authErrors[error] ? <div className="calm-alert-error" role="alert">{authErrors[error]}</div> : null}
          <form action={login} className="calm-panel">
            <p className="calm-eyebrow">Acceso</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Entrar</h2>
            <p className="calm-muted mt-2 text-sm leading-6">Accede como contador o cliente. La pantalla siguiente se adapta a tu rol.</p>
            <div className="mt-6 grid gap-4">
              <label className="calm-field">Correo o usuario
                <input className="calm-input font-normal" name="email" type="text" autoComplete="username" required />
              </label>
              <label className="calm-field">Contrasena
                <input className="calm-input font-normal" name="password" type="password" autoComplete="current-password" required />
              </label>
              <button className="calm-button-primary w-full" type="submit">Entrar</button>
            </div>
          </form>

          <form action={registerAccountant} className="calm-card p-6">
            <p className="calm-eyebrow">Nuevo despacho</p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em]">Crear cuenta contador</h2>
            <p className="calm-muted mt-2 text-sm leading-6">Crea tu espacio para administrar clientes.</p>
            <div className="mt-6 grid gap-4">
              <label className="calm-field">Nombre
                <input className="calm-input font-normal" name="name" autoComplete="name" required />
              </label>
              <label className="calm-field">Correo
                <input className="calm-input font-normal" name="email" type="email" autoComplete="email" placeholder="correo@despacho.com" required />
              </label>
              <label className="calm-field">Contrasena
                <input className="calm-input font-normal" name="password" type="password" autoComplete="new-password" placeholder="Minimo 6 caracteres" required />
              </label>
              <button className="calm-button-secondary w-full" type="submit">Crear cuenta</button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
