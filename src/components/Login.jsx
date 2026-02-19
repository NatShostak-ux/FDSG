import React from 'react';
import { loginWithGoogle } from '../firebase';
import { ARAD_BLUE, ARAD_GOLD } from '../utils/constants';

const Login = () => {
    const handleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            console.error("Login detail:", error);
            alert(`Errore durante il login: ${error.message}. Riprova.`);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <div className="bg-white p-12 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full text-center">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: ARAD_BLUE }}>
                        ARAD <span style={{ color: ARAD_GOLD }}>Digital</span>
                    </h1>
                    <p className="text-gray-500 font-medium italic">Strategy Hub | Feudi di San Gregorio</p>
                </div>

                <div className="space-y-6">
                    <p className="text-gray-600">
                        Accedi per visualizzare e collaborare alla strategia digitale.
                    </p>

                    <button
                        onClick={handleLogin}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 px-6 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                        Accedi con Google
                    </button>

                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Gli account <strong>@arad.digital</strong> avranno permessi per modificare i contenuti.<br />
                            Gli altri utenti accederanno in modalità solo lettura.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
