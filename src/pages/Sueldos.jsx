function Sueldos() {
  return (
    <div className="app">

      <h1>SueldosPH</h1>

      <div className="subtitulo">
        Sistema de liquidación de sueldos
      </div>


      <div className="datos">


        {/* CARGO */}
        <div className="campo cargo">

          <h3>Cargo</h3>

          <div className="lista-seleccion">

  <div className="item-seleccion activo">
    Encargado Permanente con vivienda
  </div>

  <div className="item-seleccion">
    Encargado Permanente sin vivienda
  </div>

  <div className="item-seleccion">
    Ayudante Permanente con vivienda
  </div>

  <div className="item-seleccion">
    Ayudante Permanente sin vivienda
  </div>

  <div className="item-seleccion">
    Ayudante Media jornada
  </div>

  <div className="item-seleccion">
    Personal Asimilado con vivienda
  </div>

  <div className="item-seleccion">
    Personal Asimilado sin vivienda
  </div>

  <div className="item-seleccion">
    Mayordomo con vivienda
  </div>

  <div className="item-seleccion">
    Mayordomo sin vivienda
  </div>

  <div className="item-seleccion">
    Intendente
  </div>

  <div className="item-seleccion">
    Personal con más de 1 función con vivienda
  </div>

  <div className="item-seleccion">
    Personal con más de 1 función sin vivienda
  </div>

  <div className="item-seleccion">
    Encargado Guardacoches con vivienda
  </div>

  <div className="item-seleccion">
    Encargado Guardacoches sin vivienda
  </div>

  <div className="item-seleccion">
    Personal Vigilancia Nocturna
  </div>

  <div className="item-seleccion">
    Personal Vigilancia Diurna
  </div>

  <div className="item-seleccion">
    Personal Vigilancia Media Jornada
  </div>

  <div className="item-seleccion">
    Encargado No Permanente con vivienda
  </div>

  <div className="item-seleccion">
    Encargado No Permanente sin vivienda
  </div>

  <div className="item-seleccion">
    Ayudante Temporario
  </div>

  <div className="item-seleccion">
    Ayudante Temporario Media Jornada
  </div>

</div>


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

          </div>


        </div>



        {/* CATEGORIA */}
        <div className="campo categoria">

          <h3>Categoría</h3>

          <div className="lista-seleccion categoria-lista">

  <div className="item-seleccion activo">
    Categoría 1
  </div>

  <div className="item-seleccion">
    Categoría 2
  </div>

  <div className="item-seleccion">
    Categoría 3
  </div>

  <div className="item-seleccion">
    Categoría 4
  </div>

</div>


          <label>
            UF
            <input className="chico"/>
          </label>


        </div>


      </div>





      <div className="bloques">


        {/* ADICIONALES */}
        <div className="box">

          <h3>Adicionales</h3>

          <label>
            <input type="checkbox"/>
            Residuos
          </label>

          <label>
            <input type="checkbox"/>
            Jardín
          </label>

          <label>
            <input type="checkbox"/>
            Limpieza autos
          </label>

          <label>
            <input type="checkbox"/>
            Movimiento autos
          </label>

        </div>





        {/* APORTES */}
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
            Sindicato
          </label>

          <label>
            <input type="checkbox" defaultChecked/>
            Obra social
          </label>

          <label>
            <input type="checkbox" defaultChecked/>
            Caja protección familia
          </label>

          <label>
            <input type="checkbox" defaultChecked/>
            Seguro vitalicio
          </label>


        </div>





        {/* RESULTADO */}
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


export default Sueldos