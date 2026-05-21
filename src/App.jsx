import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// CONFIGURACIÓN SUPABASE
const supabaseUrl = "https://csqhpyixbotvfiimtjpv.supabase.co";
const supabaseKey = "sb_publishable_yJ9qverwdCuKz8nItxHqEA_DNuUHEss";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("");

  const [form, setForm] = useState({
    investigador: "",
    proyecto: "",
    fecha: "",
    horas: ""
  });

  // LOGIN
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert("Error login");
    } else {
      setUser(data.user);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // CARGAR DATOS
  const loadRecords = async () => {
    const { data, error } = await supabase
      .from("timesheets")
      .select("*");

    if (!error) setRecords(data);
  };

  useEffect(() => {
    if (user) loadRecords();
  }, [user]);

  // AÑADIR REGISTRO
  const addRecord = async () => {
    if (!form.investigador || !form.proyecto || !form.fecha || !form.horas) return;

    const { error } = await supabase
      .from("timesheets")
      .insert([
        {
          investigador: form.investigador,
          proyecto: form.proyecto,
          fecha: form.fecha,
          horas: Number(form.horas),
          creado_por: user.email
        }
      ]);

    if (!error) {
      setForm({ investigador: "", proyecto: "", fecha: "", horas: "" });
      loadRecords();
    }
  };

  const deleteRecord = async (id) => {
    await supabase.from("timesheets").delete().eq("id", id);
    loadRecords();
  };

  // EXPORTAR
  const exportToExcel = () => {
    const headers = ["Investigador", "Proyecto", "Fecha", "Horas", "Gestor"];

    const rows = records.map((r) => [
      r.investigador,
      r.proyecto,
      r.fecha,
      r.horas,
      r.creado_por
    ]);

    const csv =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", "timesheets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = records.filter((r) =>
    r.investigador?.toLowerCase().includes(filter.toLowerCase()) ||
    r.proyecto?.toLowerCase().includes(filter.toLowerCase())
  );

  // LOGIN UI
  if (!user) {
    let inputEmail = "";
    let inputPassword = "";

    return (
      <div style={{ padding: 40 }}>
        <h2>Login</h2>

        <input placeholder="Email" onChange={(e) => (inputEmail = e.target.value)} />
        <br /><br />

        <input type="password" placeholder="Password" onChange={(e) => (inputPassword = e.target.value)} />
        <br /><br />

        <button onClick={() => login(inputEmail, inputPassword)}>Entrar</button>
      </div>
    );
  }

  // APP
  return (
    <div style={{ padding: 40 }}>
      <h1>Timesheets UE</h1>

      <button onClick={logout}>Salir</button>
      <br /><br />

      <button onClick={exportToExcel}>Exportar</button>

      <h3>Nuevo registro</h3>

      <input
        placeholder="Investigador"
        value={form.investigador}
        onChange={(e) => setForm({ ...form, investigador: e.target.value })}
      />

      <input
        placeholder="Proyecto"
        value={form.proyecto}
        onChange={(e) => setForm({ ...form, proyecto: e.target.value })}
      />

      <input
        type="date"
        value={form.fecha}
        onChange={(e) => setForm({ ...form, fecha: e.target.value })}
      />

      <input
        type="number"
        placeholder="Horas"
        value={form.horas}
        onChange={(e) => setForm({ ...form, horas: e.target.value })}
      />

      <button onClick={addRecord}>Guardar</button>

      <h3>Buscar</h3>

      <input
        placeholder="Buscar..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <table border="1" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>Investigador</th>
            <th>Proyecto</th>
            <th>Fecha</th>
            <th>Horas</th>
            <th>Gestor</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.map((r) => (
            <tr key={r.id}>
              <td>{r.investigador}</td>
              <td>{r.proyecto}</td>
              <td>{r.fecha}</td>
              <td>{r.horas}</td>
              <td>{r.creado_por}</td>
              <td>
                <button onClick={() => deleteRecord(r.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
