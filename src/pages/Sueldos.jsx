import { useState, useEffect } from "react";
import planillaJunio2026 from "../data/planillas/junio2026.json";
function Sueldos() {

  const cargos = planillaJunio2026.cargos;
  const categorias = [
    "Categoría 1",
    "Categoría 2",
    "Categoría 3",
    "Categoría 4"
  ];


  const [cargoSeleccionado, setCargoSeleccionado] = useState(cargos[0].nombre);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(categorias[0]);
  const [planillaSeleccionada, setPlanillaSeleccionada] = useState("Junio 2026");
  const [sueldoBasico, setSueldoBasico] = useState(0);
  const [antiguedad, setAntiguedad] = useState(0);
  const [horas100, setHoras100] = useState(0);
  const [horas50, setHoras50] = useState(0);
  const [adicRem, setAdicRem] = useState(0);
  const [adicNoRem, setAdicNoRem] = useState(0);
  const [canasta, setCanasta] = useState(0);
  const [uf, setUf] = useState(0);
  const [clasificacionResiduos, setClasificacionResiduos] = useState(false);
  const [retiroResiduos, setRetiroResiduos] = useState(false);
  const [jardin, setJardin] = useState(false);
  const [limpiezaCochera, setLimpiezaCochera] = useState(false);
  const [movimientoAutos, setMovimientoAutos] = useState(false);
  const [viaticos, setViaticos] = useState(false);
  const [aporteJubilatorio, setAporteJubilatorio] = useState(true);
  const [aporteINSSJP, setAporteINSSJP] = useState(true);
  const [aporteSindicato, setAporteSindicato] = useState(true);
  const [aporteObraSocial, setAporteObraSocial] = useState(true);
  const [aporteCajaFamilia, setAporteCajaFamilia] = useState(true);
  const [aporteFMVDD, setAporteFMVDD] = useState(true);
  const [aporteSeguroVitalicio, setAporteSeguroVitalicio] = useState(true);
 

  useEffect(() => {
    
  const cargo = planillaJunio2026.cargos.find(
    c => c.nombre === cargoSeleccionado
  );

  if (!cargo) return;

  const numeroCategoria = categoriaSeleccionada.replace("Categoría ", "");

  const sueldo = cargo.categorias[numeroCategoria];

  setSueldoBasico(sueldo);

}, [cargoSeleccionado, categoriaSeleccionada]);

let bruto = sueldoBasico + adicRem;


if (clasificacionResiduos) {
  bruto += planillaJunio2026.adicionales.clasificacionResiduos;
}

if (retiroResiduos) {
  bruto += planillaJunio2026.adicionales.retiroResiduos * uf;
}

if (jardin) {
  bruto += planillaJunio2026.adicionales.jardin;
}

if (limpiezaCochera) {
  bruto += planillaJunio2026.adicionales.limpiezaCocheras;
}

if (movimientoAutos) {
  bruto += planillaJunio2026.adicionales.movimientoCoches;
}

if (viaticos) {
  bruto += planillaJunio2026.adicionales.viaticos;
}

let descuentos = 0;


if (aporteJubilatorio) {
  descuentos += bruto * 0.11;
}

if (aporteINSSJP) {
  descuentos += bruto * 0.03;
}

if (aporteSindicato) {
  descuentos += bruto * 0.02;
}

if (aporteObraSocial) {
  descuentos += bruto * 0.03;
}

if (aporteCajaFamilia) {
  descuentos += bruto * 0.01;
}

if (aporteFMVDD) {
  descuentos += bruto * 0.01;
}

if (aporteSeguroVitalicio) {
  descuentos += bruto * 0.0075;
}


let neto = bruto - descuentos + adicNoRem;

return (
  <div className="app">


    <div className="selector-planilla">

      <label>
        Planilla Salarial

        <select
          value={planillaSeleccionada}
          onChange={(e) => setPlanillaSeleccionada(e.target.value)}
        >

          <option>
            Junio 2026
          </option>

          <option>
            Julio 2026
          </option>

        </select>

      </label>

    </div>



    <h1>SueldosPH</h1>

      <div className="subtitulo">
        Sistema de liquidación de sueldos
      </div>



      <div className="datos">


        {/* CARGOS */}

        <div className="campo cargo">

          <h3>Cargo</h3>


          <div className="lista-seleccion">

        {
  cargos.map((cargo) => (

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

  ))
}

          </div>


        </div>




        {/* CATEGORIAS */}

        <div className="campo categoria">


          <h3>Categoría</h3>


          <div className="lista-seleccion categoria-lista">


            {
              categorias.map((categoria)=>(

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


              ))
            }


          </div>



          <label>
  UF
  <input
    className="chico"
    type="number"
    value={uf}
    onChange={(e) => setUf(Number(e.target.value))}
  />
</label>
          <div className="datos-horas">


  <label>
  Antigüedad
  <input
    className="chico"
    type="number"
    value={antiguedad}
    onChange={(e) => setAntiguedad(Number(e.target.value))}
  />
</label>


  <label>
  Horas 100%
  <input
    className="chico"
    type="number"
    value={horas100}
    onChange={(e) => setHoras100(Number(e.target.value))}
  />
</label>


  <label>
  Horas 50%
  <input
    className="chico"
    type="number"
    value={horas50}
    onChange={(e) => setHoras50(Number(e.target.value))}
  />
</label>


<label>
  Adic. Remunerativo
  <input
    className="chico"
    type="number"
    value={adicRem}
    onChange={(e)=>setAdicRem(Number(e.target.value))}
  />
</label>
  
 <label>
  Adic. No Remunerativo
  <input
    className="chico"
    type="number"
    value={adicNoRem}
    onChange={(e)=>setAdicNoRem(Number(e.target.value))}
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
    checked={clasificacionResiduos}
    onChange={(e)=>setClasificacionResiduos(e.target.checked)}
  />
  C. Residuos
</label>

<label>
  <input
    type="checkbox"
    checked={retiroResiduos}
    onChange={(e)=>setRetiroResiduos(e.target.checked)}
  />
  R. Residuos
</label>


  <label>
  <input
    type="checkbox"
    checked={jardin}
    onChange={(e) => setJardin(e.target.checked)}
  />
  Jardín
</label>


 <label>
  <input
    type="checkbox"
    checked={limpiezaCochera}
    onChange={(e)=>setLimpiezaCochera(e.target.checked)}
  />
  Limpieza de cochera
</label>


<label>
  <input
    type="checkbox"
    checked={movimientoAutos}
    onChange={(e)=>setMovimientoAutos(e.target.checked)}
  />
  Movimiento de autos
</label>


<label>
  <input
    type="checkbox"
    checked={viaticos}
    onChange={(e)=>setViaticos(e.target.checked)}
  />
  Viáticos
</label>

</div>





        <div className="box">

  <h3>Aportes</h3>


  <label>
  <input
    type="checkbox"
    checked={aporteJubilatorio}
    onChange={(e)=>setAporteJubilatorio(e.target.checked)}
  />
  Jubilatorio 11%
</label>


<label>
  <input
    type="checkbox"
    checked={aporteINSSJP}
    onChange={(e)=>setAporteINSSJP(e.target.checked)}
  />
  INSSJP 3%
</label>


<label>
  <input
    type="checkbox"
    checked={aporteSindicato}
    onChange={(e)=>setAporteSindicato(e.target.checked)}
  />
  Sindicato 2%
</label>


<label>
  <input
    type="checkbox"
    checked={aporteObraSocial}
    onChange={(e)=>setAporteObraSocial(e.target.checked)}
  />
  Obra social 3%
</label>


<label>
  <input
    type="checkbox"
    checked={aporteCajaFamilia}
    onChange={(e)=>setAporteCajaFamilia(e.target.checked)}
  />
  Caja protección a la familia 1%
</label>


<label>
  <input
    type="checkbox"
    checked={aporteFMVDD}
    onChange={(e)=>setAporteFMVDD(e.target.checked)}
  />
  FMVDD 1%
</label>


<label>
  <input
    type="checkbox"
    checked={aporteSeguroVitalicio}
    onChange={(e)=>setAporteSeguroVitalicio(e.target.checked)}
  />
  Seguro vitalicio 0,75%
</label>


</div>





        <div className="resultado">


          <h3>Resultado</h3>


          <p>Bruto: ${bruto.toLocaleString("es-AR")}</p>
          <p>
  No remunerativo: ${adicNoRem.toLocaleString("es-AR")}
</p>
          <p>
  Descuentos: ${descuentos.toLocaleString("es-AR")}
</p>

<p>
  Neto: ${neto.toLocaleString("es-AR")}
</p>



          <button>
            CALCULAR
          </button>


          <button>
            REINICIAR
          </button>



        </div>


      </div>


    </div>
  )
}


export default Sueldos;