import { useState } from "react";

function Sueldos() {

  const cargos = [
    "Encargado Permanente con vivienda",
    "Encargado Permanente sin vivienda",
    "Ayudante Permanente con vivienda",
    "Ayudante Permanente sin vivienda",
    "Ayudante Media jornada",
    "Personal Asimilado con vivienda",
    "Personal Asimilado sin vivienda",
    "Mayordomo con vivienda",
    "Mayordomo sin vivienda",
    "Intendente",
    "Personal con más de 1 función con vivienda",
    "Personal con más de 1 función sin vivienda",
    "Encargado Guardacoches con vivienda",
    "Encargado Guardacoches sin vivienda",
    "Personal Vigilancia Nocturna",
    "Personal Vigilancia Diurna",
    "Personal Vigilancia Media Jornada",
    "Encargado No Permanente con vivienda",
    "Encargado No Permanente sin vivienda",
    "Ayudante Temporario",
    "Ayudante Temporario Media Jornada"
  ];


  const categorias = [
    "Categoría 1",
    "Categoría 2",
    "Categoría 3",
    "Categoría 4"
  ];


  const [cargoSeleccionado, setCargoSeleccionado] = useState(cargos[0]);

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(categorias[0]);

  const [planillaSeleccionada, setPlanillaSeleccionada] = useState("Junio 2026");


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
                  key={cargo}
                  className={
                    cargoSeleccionado === cargo
                    ? "item-seleccion activo"
                    : "item-seleccion"
                  }

                  onClick={() => setCargoSeleccionado(cargo)}
                >

                  {cargo}

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
            <input className="chico"/>
          </label>
          <div className="datos-horas">


  <label>
    Antigüedad
    <input className="chico"/>
  </label>


  <label>
    Horas 100%
    <input className="chico"/>
  </label>


  <label>
    Horas 50%
    <input className="chico"/>
  </label>


  <label>
    Adic. Remunerativo
    <input className="chico"/>
  </label>


  <label>
    Adic. No Remunerativo
    <input className="chico"/>
  </label>
  
  <label>
    C. Alimentaria 
    <input className="chico"/>
  </label>

</div>


        </div>


      </div>





      <div className="bloques">



        <div className="box adicionales">

  <h3>Adicionales</h3>


  <label>
    <input type="checkbox"/>
    C. Residuos
  </label>


  <label>
    <input type="checkbox"/>
    R. Residuos
  </label>


  <label>
    <input type="checkbox"/>
    Jardín
  </label>


  <label>
    <input type="checkbox"/>
    Limpieza de cochera
  </label>


  <label>
    <input type="checkbox"/>
    Movimiento de autos
  </label>

  <label>
  <input type="checkbox"/>
  Viáticos
  </label>

</div>





        <div className="box">

  <h3>Aportes</h3>


  <label>
    <input type="checkbox" defaultChecked/>
    Jubilatorio 11%
  </label>


  <label>
    <input type="checkbox" defaultChecked/>
    INSSJP 3%
  </label>


  <label>
    <input type="checkbox" defaultChecked/>
    Sindicato 2%
  </label>


  <label>
    <input type="checkbox" defaultChecked/>
    Obra social 3%
  </label>


  <label>
    <input type="checkbox" defaultChecked/>
    Caja protección a la familia 1%
  </label>


  <label>
    <input type="checkbox" defaultChecked/>
    FMVDD 1%
  </label>


  <label>
    <input type="checkbox" defaultChecked/>
    Seguro vitalicio 0,75%
  </label>


</div>





        <div className="resultado">


          <h3>Resultado</h3>


          <p>Bruto: $0</p>
          <p>Descuentos: $0</p>
          <p>Neto: $0</p>



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