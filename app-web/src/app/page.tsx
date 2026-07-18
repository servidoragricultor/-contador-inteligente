import { redirect } from "next/navigation";
import { login, registerAccountant } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/empresas");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),linear-gradient(135deg,#f8fafc,#eef2ff)] px-6 py-10">
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center rounded-3xl bg-slate-950 p-10 text-white shadow-2xl">
          <p className="mb-4 w-fit rounded-full bg-blue-500/20 px-4 py-2 text-sm text-blue-100">
            Etapa 1: ingresos, gastos y XML
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Registros simples para clientes. Revision clara para contadores.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            El cliente captura ingresos y gastos o sube XML CFDI. El contador revisa, corrige y valida sin perseguir comprobantes desordenados.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Multiempresa</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Roles simples</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">XML automatico</div>
          </div>
        </div>

        <div className="grid gap-6">
          <form action={login} className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <h2 className="text-2xl font-semibold">Entrar</h2>
            <p className="mt-2 text-sm text-slate-500">Accede como contador o cliente.</p>
            <div className="mt-6 grid gap-4">
              <input className="rounded-xl border border-slate-200 px-4 py-3" name="email" type="email" placeholder="correo@empresa.com" required />
              <input className="rounded-xl border border-slate-200 px-4 py-3" name="password" type="password" placeholder="Contrasena" required />
              <button className="rounded-xl bg-slate-950 px-4 py-3 font-medium text-white" type="submit">Entrar</button>
            </div>
          </form>

          <form action={registerAccountant} className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <h2 className="text-2xl font-semibold">Crear cuenta contador</h2>
            <p className="mt-2 text-sm text-slate-500">Base inicial para administrar empresas.</p>
            <div className="mt-6 grid gap-4">
              <input className="rounded-xl border border-slate-200 px-4 py-3" name="name" placeholder="Nombre" required />
              <input className="rounded-xl border border-slate-200 px-4 py-3" name="email" type="email" placeholder="correo@despacho.com" required />
              <input className="rounded-xl border border-slate-200 px-4 py-3" name="password" type="password" placeholder="Minimo 6 caracteres" required />
              <button className="rounded-xl bg-blue-600 px-4 py-3 font-medium text-white" type="submit">Crear cuenta</button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
