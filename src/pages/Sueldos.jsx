import { useState, useEffect, useMemo } from "react";
import planillaJunio2026 from "../data/planillas/junio2026.json";
import planillaMayo2026 from "../data/planillas/mayo2026.json";

const planillas = {
  "Junio 2026": planillaJunio2026,
  "Mayo 2026": planillaMayo2026
};

const cargosAntiguedad1 = [
  "Ayudante Media jornada",
  "Personal Vigilancia Media Jornada",
  "Ayudante Temporario Media Jornada",
  "Suplentes fijos",
  "Jornalizados"
];

const categorias = [
  "Categoría 1",
  "Categoría 2",
  "Categoría 3",
  "Categoría 4"
];

const initialInputs = {
  antiguedad: 0,
  horas100: 0,
  horas50: 0,
  adicRem: 0,
  adicNoRem: 0,
  uf: 0
};

const initialAdicionales = {
  clasificacionResiduos: false,
  retiroResiduos: false,
  jardin: false,
  limpiezaCochera: false,
  movimientoAutos: false,
  viaticos: false,
  tituloEncargadoIntegral: false
};

const initialAportes = {
  aporteJubilatorio: true,
  aporteINSSJP: true,
  aporteSindicato: true,
  aporteObraSocial: true,
  aporteCajaFamilia: true,
  aporteFMVDD: true,
  aporteSeguroVitalicio: true
};

function Sueldos() {
  const [planillaSeleccionada, setPlanillaSeleccionada] = useState("Junio 2026");
  const [cargoSeleccionado, setCargoSeleccionado] = useState(
    planillaJunio2026.cargos[0]?.nombre ?? ""
  );
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(categorias[0]);
  const [inputs, setInputs] = useState(initialInputs);
  const [adicionales, setAdicionales] = useState(initialAdicionales);
  const [aportes, setAportes] = useState(initialAportes);
  const [mostrarModal, setMostrarModal] = useState(false);

  const planillaActual = useMemo(
    () => planillas[planillaSeleccionada],
    [planillaSeleccionada]
  );

  useEffect(() => {
    const cargoValido = planillaActual.cargos.some(
      (cargo) => cargo.nombre === cargoSeleccionado
    );
    if (!cargoValido) {
      setCargoSeleccionado(planillaActual.cargos[0]?.nombre ?? "");
    }
  }, [planillaActual, cargoSeleccionado]);

  const handleInput = (field) => (event) => {
  const raw = event.target.value;
  setInputs((prev) => ({
    ...prev,
    [field]: raw === "" ? "" : Number(raw)
  }));
};

  const handleToggle = (group, field) => (event) => {
    const value = event.target.checked;
    const setter = group === "adicionales" ? setAdicionales : setAportes;
    setter((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputFocus = (event) => {
  event.target.select();
};

const handleInputMouseUp = (event) => {
  event.preventDefault();
}; 

  const categoriaNumero = useMemo(
    () => Number(categoriaSeleccionada.replace(/\D/g, "")),
    [categoriaSeleccionada]
  );

  const sueldoBasico = useMemo(() => {
    const cargo = planillaActual.cargos.find((c) => c.nombre === cargoSeleccionado);
    if (!cargo) return 0;

    const categoriasData = cargo.categorias;
    if (Array.isArray(categoriasData)) {
      return categoriasData[categoriaNumero - 1] ?? 0;
    }

    return (
      categoriasData?.[categoriaNumero] ??
      categoriasData?.[`Categoría ${categoriaNumero}`] ??
      0
    );
  }, [cargoSeleccionado, categoriaNumero, planillaActual.cargos]);

  const adicionalAntiguedad = useMemo(() => {
    if (inputs.antiguedad <= 0) return 0;
    const plus = cargosAntiguedad1.includes(cargoSeleccionado)
      ? planillaActual.adicionales.plusAntiguedad1
      : planillaActual.adicionales.plusAntiguedad2;
    return inputs.antiguedad * plus;
  }, [inputs.antiguedad, cargoSeleccionado, planillaActual.adicionales]);

  const adicionalVivienda = useMemo(
    () =>
      cargoSeleccionado.toLowerCase().includes("vivienda")
        ? planillaActual.adicionales.valorVivienda
        : 0,
    [cargoSeleccionado, planillaActual.adicionales]
  );

  const adicionalTituloEncargado = useMemo(
    () =>
      adicionales.tituloEncargadoIntegral
        ? sueldoBasico * (planillaActual.adicionales.tituloEncargadoIntegral / 100)
        : 0,
    [adicionales.tituloEncargadoIntegral, sueldoBasico, planillaActual.adicionales]
  );

  const montoRetiroResiduos = useMemo(
    () =>
      adicionales.retiroResiduos
        ? planillaActual.adicionales.retiroResiduos * inputs.uf
        : 0,
    [adicionales.retiroResiduos, planillaActual.adicionales.retiroResiduos, inputs.uf]
  );

  const montoClasifResiduos = useMemo(
    () =>
      adicionales.clasificacionResiduos
        ? planillaActual.adicionales.clasificacionResiduos
        : 0,
    [adicionales.clasificacionResiduos, planillaActual.adicionales.clasificacionResiduos]
  );

  const montoJardin = useMemo(
    () => (adicionales.jardin ? planillaActual.adicionales.jardin : 0),
    [adicionales.jardin, planillaActual.adicionales.jardin]
  );

  const montoLimpiezaCochera = useMemo(
    () => (adicionales.limpiezaCochera ? planillaActual.adicionales.limpiezaCocheras : 0),
    [adicionales.limpiezaCochera, planillaActual.adicionales.limpiezaCocheras]
  );

  const montoMovimientoAutos = useMemo(
    () => (adicionales.movimientoAutos ? planillaActual.adicionales.movimientoCoches : 0),
    [adicionales.movimientoAutos, planillaActual.adicionales.movimientoCoches]
  );

  const montoViaticos = useMemo(
    () => (adicionales.viaticos ? planillaActual.adicionales.viaticos : 0),
    [adicionales.viaticos, planillaActual.adicionales.viaticos]
  );

  const totalAdicionales = useMemo(
    () =>
      montoRetiroResiduos +
      montoClasifResiduos +
      montoJardin +
      montoLimpiezaCochera +
      montoMovimientoAutos +
      montoViaticos +
      adicionalTituloEncargado,
    [
      montoRetiroResiduos,
      montoClasifResiduos,
      montoJardin,
      montoLimpiezaCochera,
      montoMovimientoAutos,
      montoViaticos,
      adicionalTituloEncargado
    ]
  );

  const baseSueldo = useMemo(
    () => sueldoBasico + inputs.adicRem + adicionalAntiguedad + adicionalVivienda,
    [sueldoBasico, inputs.adicRem, adicionalAntiguedad, adicionalVivienda]
  );

  const valorHora = useMemo(
    () =>
      (
        sueldoBasico +
        adicionalAntiguedad +
        montoRetiroResiduos +
        montoClasifResiduos +
        inputs.adicRem +
        adicionalVivienda
      ) / 200,
    [
      sueldoBasico,
      adicionalAntiguedad,
      montoRetiroResiduos,
      montoClasifResiduos,
      inputs.adicRem,
      adicionalVivienda
    ]
  );

  const totalHorasExtras = useMemo(
    () => inputs.horas100 * valorHora * 2 + inputs.horas50 * valorHora * 2,
    [inputs.horas100, inputs.horas50, valorHora]
  );

  const bruto = useMemo(
    () => baseSueldo + totalAdicionales + totalHorasExtras,
    [baseSueldo, totalAdicionales, totalHorasExtras]
  );

  const descuentos = useMemo(() => {
    let total = 0;
    if (aportes.aporteJubilatorio) total += bruto * 0.11;
    if (aportes.aporteINSSJP) total += bruto * 0.03;
    if (aportes.aporteSindicato) total += bruto * 0.02;
    if (aportes.aporteObraSocial) total += bruto * 0.03;
    if (aportes.aporteCajaFamilia) total += bruto * 0.01;
    if (aportes.aporteFMVDD) total += bruto * 0.01;
    if (aportes.aporteSeguroVitalicio) total += bruto * 0.0075;
    total += adicionalVivienda;
    return total;
  }, [aportes, bruto, adicionalVivienda]);

  const neto = useMemo(
    () => bruto - descuentos + inputs.adicNoRem,
    [bruto, descuentos, inputs.adicNoRem]
  );

  const detalleHaberes = useMemo(() => {
    const rows = [
      { detalle: "SUELDO BÁSICO", unidad: "", haber: sueldoBasico, descuento: 0 }
    ];

    if (inputs.antiguedad > 0) {
      rows.push({
        detalle: `ANTIGÜEDAD - ${inputs.antiguedad}%`,
        unidad: `${inputs.antiguedad} AÑOS`,
        haber: adicionalAntiguedad,
        descuento: 0
      });
    }

    if (montoRetiroResiduos > 0) {
      rows.push({
        detalle: "RETIRO RESIDUOS",
        unidad: `${inputs.uf} UFS`,
        haber: montoRetiroResiduos,
        descuento: 0
      });
    }

    if (montoClasifResiduos > 0) {
      rows.push({
        detalle: "CLASIF. RESIDUOS",
        unidad: `${inputs.uf} UFS`,
        haber: montoClasifResiduos,
        descuento: 0
      });
    }

    if (inputs.adicRem > 0) {
      rows.push({
        detalle: `SUMA REMUNERATIVA ${planillaSeleccionada}`,
        unidad: "",
        haber: inputs.adicRem,
        descuento: 0
      });
    }

    if (montoJardin > 0) {
      rows.push({
        detalle: "JARDÍN",
        unidad: "",
        haber: montoJardin,
        descuento: 0
      });
    }

    if (montoLimpiezaCochera > 0) {
      rows.push({
        detalle: "LIMPIEZA COCHERA",
        unidad: "",
        haber: montoLimpiezaCochera,
        descuento: 0
      });
    }

    if (montoMovimientoAutos > 0) {
      rows.push({
        detalle: "MOVIMIENTO AUTOS",
        unidad: "",
        haber: montoMovimientoAutos,
        descuento: 0
      });
    }

    if (montoViaticos > 0) {
      rows.push({
        detalle: "VIÁTICOS",
        unidad: "",
        haber: montoViaticos,
        descuento: 0
      });
    }

    if (inputs.horas100 > 0) {
      rows.push({
        detalle: "HORAS EXTRAS AL 100% FERIADOS",
        unidad: `${inputs.horas100} HS`,
        haber: inputs.horas100 * valorHora * 2,
        descuento: 0
      });
    }

    if (adicionalVivienda > 0) {
      rows.push({
        detalle: "VIVIENDA",
        unidad: "",
        haber: adicionalVivienda,
        descuento: 0
      });
    }

    if (inputs.horas50 > 0) {
      rows.push({
        detalle: "HORAS EXTRAS AL 100% SÁBADOS",
        unidad: `${inputs.horas50} HS`,
        haber: inputs.horas50 * valorHora * 1.5,
        descuento: 0
      });
    }

    if (adicionalTituloEncargado > 0) {
      rows.push({
        detalle: "TÍTULO ENCARGADO INTEGRAL",
        unidad: "",
        haber: adicionalTituloEncargado,
        descuento: 0
      });
    }

    rows.push({
      detalle: "TOTAL HABERES",
      unidad: "",
      haber: bruto,
      descuento: 0
    });

    return rows;
  }, [
    sueldoBasico,
    adicionalAntiguedad,
    montoRetiroResiduos,
    montoClasifResiduos,
    inputs.adicRem,
    planillaSeleccionada,
    montoJardin,
    montoLimpiezaCochera,
    montoMovimientoAutos,
    montoViaticos,
    adicionalVivienda,
    inputs.horas100,
    inputs.horas50,
    valorHora,
    adicionalTituloEncargado,
    bruto
  ]);

  const detalleDescuentos = useMemo(() => {
    const rows = [];

    if (aportes.aporteJubilatorio) {
      rows.push({
        detalle: "APORTE JUBILATORIO 11%",
        unidad: "",
        haber: 0,
        descuento: bruto * 0.11
      });
    }
    if (aportes.aporteINSSJP) {
      rows.push({
        detalle: "INSSJP 3%",
        unidad: "",
        haber: 0,
        descuento: bruto * 0.03
      });
    }
    if (aportes.aporteObraSocial) {
      rows.push({
        detalle: "OBRA SOCIAL 3%",
        unidad: "",
        haber: 0,
        descuento: bruto * 0.03
      });
    }
    if (aportes.aporteCajaFamilia) {
      rows.push({
        detalle: "CAJA PROTECCIÓN FAMILIA 1%",
        unidad: "",
        haber: 0,
        descuento: bruto * 0.01
      });
    }
    if (aportes.aporteFMVDD) {
      rows.push({
        detalle: "FATERYH (FMVDD) 1%",
        unidad: "",
        haber: 0,
        descuento: bruto * 0.01
      });
    }
    if (aportes.aporteSindicato) {
      rows.push({
        detalle: "CUOTA SINDICAL 2%",
        unidad: "",
        haber: 0,
        descuento: bruto * 0.02
      });
    }
    if (aportes.aporteSeguroVitalicio) {
      rows.push({
        detalle: "SEGURO VITALICIO 0,75%",
        unidad: "",
        haber: 0,
        descuento: bruto * 0.0075
      });
    }

    if (adicionalVivienda > 0) {
      rows.push({
        detalle: "VIVIENDA",
        unidad: "",
        haber: 0,
        descuento: adicionalVivienda
      });
    }

    rows.push({
      detalle: "TOTAL DESCUENTOS",
      unidad: "",
      haber: 0,
      descuento: descuentos
    });

    return rows;
  }, [aportes, bruto, adicionalVivienda, descuentos]);

  const handleCalcular = () => {
    setMostrarModal(true);
  };

  const closeModal = () => {
    setMostrarModal(false);
  };

  const reset = () => {
    setPlanillaSeleccionada("Junio 2026");
    setCategoriaSeleccionada(categorias[0]);
    setInputs(initialInputs);
    setAdicionales(initialAdicionales);
    setAportes(initialAportes);
    setMostrarModal(false);
  };

  return (
    <div className="app">
      <div className="selector-planilla">
        <label>
          Planilla
          <select
            value={planillaSeleccionada}
            onChange={(e) => setPlanillaSeleccionada(e.target.value)}
          >
            {Object.keys(planillas).map((nombre) => (
              <option key={nombre} value={nombre}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h1>SueldosPH</h1>
      <div className="subtitulo">Sistema de liquidación de sueldos</div>

      <div className="datos">
        <div className="campo cargo">
          <h3>Cargo</h3>
          <div className="lista-seleccion">
            {planillaActual.cargos.map((cargo) => (
              <div
                key={cargo.id}
                className={
                  cargoSeleccionado === cargo.nombre
                    ? "item-seleccion activo"
                    : "item-seleccion"
                }
                onClick={() => setCargoSeleccionado(cargo.nombre)}
              >
                {cargo.nombre}
              </div>
            ))}
          </div>
        </div>

        <div className="campo categoria">
          <h3>Categoría</h3>
          <div className="lista-seleccion categoria-lista">
            {categorias.map((categoria) => (
              <div
                key={categoria}
                className={
                  categoriaSeleccionada === categoria
                    ? "item-seleccion activo"
                    : "item-seleccion"
                }
                onClick={() => setCategoriaSeleccionada(categoria)}
              >
                {categoria}
              </div>
            ))}
          </div>

          <label>
            UF
            <input
              className="chico"
              type="number"
              value={inputs.uf}
              onChange={handleInput("uf")}
              onFocus={handleInputFocus}
              onMouseUp={handleInputMouseUp}
            />
          </label>

          <div className="datos-horas">
            <label>
              Antigüedad
              <input
                className="chico"
                type="number"
                value={inputs.antiguedad}
                onChange={handleInput("antiguedad")}
                onFocus={handleInputFocus}
                onMouseUp={handleInputMouseUp}
              />
            </label>

            <label>
              Horas 100%
              <input
                className="chico"
                type="number"
                value={inputs.horas100}
                onChange={handleInput("horas100")}
                onFocus={handleInputFocus}
                onMouseUp={handleInputMouseUp}
              />
            </label>

            <label>
              Horas 50%
              <input
                className="chico"
                type="number"
                value={inputs.horas50}
                onChange={handleInput("horas50")}
                onFocus={handleInputFocus}
                onMouseUp={handleInputMouseUp}
              />
            </label>

            <label>
              Adic. Remunerativo
              <input
                className="chico"
                type="number"
                value={inputs.adicRem}
                onChange={handleInput("adicRem")}
                onFocus={handleInputFocus}
                onMouseUp={handleInputMouseUp}
              />
            </label>

            <label>
              Adic. No Remunerativo
              <input
                className="chico"
                type="number"
                value={inputs.adicNoRem}
                onChange={handleInput("adicNoRem")}
                onFocus={handleInputFocus}
                onMouseUp={handleInputMouseUp}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="bloques">
        <div className="box adicionales">
          <h3>Adicionales</h3>
          <label>
            <input
              type="checkbox"
              checked={adicionales.clasificacionResiduos}
              onChange={handleToggle("adicionales", "clasificacionResiduos")}
            />
            C. Residuos
          </label>

          <label>
            <input
              type="checkbox"
              checked={adicionales.retiroResiduos}
              onChange={handleToggle("adicionales", "retiroResiduos")}
            />
            R. Residuos
          </label>

          <label>
            <input
              type="checkbox"
              checked={adicionales.jardin}
              onChange={handleToggle("adicionales", "jardin")}
            />
            Jardín
          </label>

          <label>
            <input
              type="checkbox"
              checked={adicionales.limpiezaCochera}
              onChange={handleToggle("adicionales", "limpiezaCochera")}
            />
            Limpieza de cochera
          </label>

          <label>
            <input
              type="checkbox"
              checked={adicionales.movimientoAutos}
              onChange={handleToggle("adicionales", "movimientoAutos")}
            />
            Movimiento de autos
          </label>

          <label>
            <input
              type="checkbox"
              checked={adicionales.viaticos}
              onChange={handleToggle("adicionales", "viaticos")}
            />
            Viáticos
          </label>

          <label>
            <input
              type="checkbox"
              checked={adicionales.tituloEncargadoIntegral}
              onChange={handleToggle("adicionales", "tituloEncargadoIntegral")}
            />
            Título Encargado Integral
          </label>
        </div>

        <div className="box">
          <h3>Aportes</h3>
          <label>
            <input
              type="checkbox"
              checked={aportes.aporteJubilatorio}
              onChange={handleToggle("aportes", "aporteJubilatorio")}
            />
            Jubilatorio 11%
          </label>

          <label>
            <input
              type="checkbox"
              checked={aportes.aporteINSSJP}
              onChange={handleToggle("aportes", "aporteINSSJP")}
            />
            INSSJP 3%
          </label>

          <label>
            <input
              type="checkbox"
              checked={aportes.aporteSindicato}
              onChange={handleToggle("aportes", "aporteSindicato")}
            />
            Sindicato 2%
          </label>

          <label>
            <input
              type="checkbox"
              checked={aportes.aporteObraSocial}
              onChange={handleToggle("aportes", "aporteObraSocial")}
            />
            Obra social 3%
          </label>

          <label>
            <input
              type="checkbox"
              checked={aportes.aporteCajaFamilia}
              onChange={handleToggle("aportes", "aporteCajaFamilia")}
            />
            Caja protección a la familia 1%
          </label>

          <label>
            <input
              type="checkbox"
              checked={aportes.aporteFMVDD}
              onChange={handleToggle("aportes", "aporteFMVDD")}
            />
            FMVDD 1%
          </label>

          <label>
            <input
              type="checkbox"
              checked={aportes.aporteSeguroVitalicio}
              onChange={handleToggle("aportes", "aporteSeguroVitalicio")}
            />
            Seguro vitalicio 0,75%
          </label>
        </div>

        <div className="resultado">
          <button type="button" onClick={handleCalcular}>
            CALCULAR
          </button>
          <button type="button" onClick={reset}>
            REINICIAR
          </button>
        </div>
      </div>

      {mostrarModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalle de liquidación</h3>
              <button className="modal-close" onClick={closeModal} aria-label="Cerrar">
                ×
              </button>
            </div>

            <table className="modal-table">
              <thead>
                <tr>
                  <th>Detalle</th>
                  <th>Unidad</th>
                  <th>Haberes</th>
                  <th>Descuento</th>
                </tr>
              </thead>
              <tbody>
  {detalleHaberes.map((item) => (
    <tr
      key={item.detalle}
      className={item.detalle === "TOTAL HABERES" ? "fila-total" : ""}
    >
      <td>{item.detalle}</td>
      <td>{item.unidad}</td>
      <td>{item.haber.toLocaleString("es-AR")}</td>
      <td>{item.descuento ? item.descuento.toLocaleString("es-AR") : ""}</td>
    </tr>
  ))}

  {detalleDescuentos.map((item) => (
    <tr
      key={item.detalle}
      className={item.detalle === "TOTAL DESCUENTOS" ? "fila-total" : ""}
    >
      <td>{item.detalle}</td>
      <td>{item.unidad}</td>
      <td>{item.haber ? item.haber.toLocaleString("es-AR") : ""}</td>
      <td>{item.descuento.toLocaleString("es-AR")}</td>
    </tr>
  ))}
</tbody>
            </table>

            <div className="modal-totales">
              <p>Total bruto: ${bruto.toLocaleString("es-AR")}</p>
              <p>Total descuentos: ${descuentos.toLocaleString("es-AR")}</p>
              <p>Neto a cobrar: ${neto.toLocaleString("es-AR")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sueldos;