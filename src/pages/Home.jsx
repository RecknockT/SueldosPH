import { Link } from "react-router-dom";
import "../styles/Home.css";

function Home() {
    return (
        <div className="home">

            <div className="overlay">

                <div className="hero">

                    <h1>SueldosPH</h1>

                    <p>
                        Sistema Profesional para Liquidación de
                        Sueldos de Propiedad Horizontal
                    </p>

                    <Link to="/login">
                        <button>
                            INGRESAR
                        </button>
                    </Link>

                </div>

            </div>

        </div>
    );
}

export default Home;