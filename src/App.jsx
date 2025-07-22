import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
    collection,
    onSnapshot,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    writeBatch
} from 'firebase/firestore';
import { db, appId } from './firebase/config.jsx';
import { useAuth } from './hooks/useAuth.js';
// Asumimos que este servicio existe para la lógica de Transbank
// import { confirmWebpayTransaction } from './services/transbankService.js';

// --- Componentes y Vistas ---
// Componentes principales cargados al inicio
import Navbar from './components/Navbar.jsx';
import ModalMessage from './components/ModalMessage.jsx';
import AuthScreen from './views/AuthScreen.jsx';
import Dashboard from './views/Dashboard.jsx';
import ProductList from './views/ProductList.jsx';
import ProductForm from './views/ProductForm.jsx';
import StockAdjustment from './views/StockAdjustment.jsx';
import MovementHistory from './views/MovementHistory.jsx';
import Reports from './views/Reports.jsx';
import Settings from './views/Settings.jsx';
import Suppliers from './views/Suppliers.jsx';
import ExpirationReport from './views/ExpirationReport.jsx';

// Carga perezosa (Lazy Loading) para el Punto de Venta
// Esto mejora el rendimiento inicial y requiere <Suspense> para funcionar.
const PointOfSale = lazy(() => import('./views/PointOfSale.jsx'));


// --- Custom Hook para manejar la lógica del inventario ---
// Este hook centraliza la carga de datos de Firestore.
const useInventory = (userId) => {
    const [products, setProducts] = useState([]);
    const [movements, setMovements] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const paths = {
            products: `artifacts/${appId}/users/${userId}/products`,
            movements: `artifacts/${appId}/users/${userId}/movements`,
            suppliers: `artifacts/${appId}/users/${userId}/suppliers`,
        };

        const unsubProducts = onSnapshot(collection(db, paths.products),
            (snap) => {
                const productList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setProducts(productList);
                const uniqueCategories = [...new Set(productList.map(p => p.category).filter(Boolean))];
                setCategories(["Todas", ...uniqueCategories]);
                setLoading(false);
            },
            (err) => {
                console.error("Error al cargar productos:", err);
                setError("Error al cargar productos.");
                setLoading(false);
            }
        );

        const unsubMovements = onSnapshot(collection(db, paths.movements),
            (snap) => {
                const movementList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                // Ordenar por fecha descendente
                movementList.sort((a, b) => new Date(b.date) - new Date(a.date));
                setMovements(movementList);
            },
            (err) => {
                console.error("Error al cargar movimientos:", err);
                setError("Error al cargar movimientos.");
            }
        );

        const unsubSuppliers = onSnapshot(collection(db, paths.suppliers),
            (snap) => {
                setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            },
            (err) => {
                console.error("Error al cargar proveedores:", err);
                setError("Error al cargar proveedores.");
            }
        );

        // Función de limpieza para desuscribirse de los listeners de Firestore
        return () => {
            unsubProducts();
            unsubMovements();
            unsubSuppliers();
        };
    }, [userId]); // Se ejecuta de nuevo si el userId cambia

    return { products, movements, categories, suppliers, loading, error };
};


// --- Componente Principal de la Aplicación ---
const App = () => {
    // Hooks de autenticación e inventario
    const { user, loading: authLoading, error: authError, registerWithEmail, loginWithEmail, logout } = useAuth();
    const { products, movements, categories, suppliers, loading: dataLoading, error: dataError } = useInventory(user?.uid);

    // Estado para la navegación y la UI
    const [view, setView] = useState('dashboard');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modal, setModal] = useState(null);
    const [settings, setSettings] = useState(null);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    // Efecto para manejar el tema (claro/oscuro)
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Efecto para sincronizar la vista con la URL (hash)
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            const validViews = ['dashboard', 'pos', 'products', 'add-product', 'edit-product', 'suppliers', 'reports', 'settings', 'adjust-stock', 'movements', 'expiration-report'];
            setView(validViews.includes(hash) ? hash : 'dashboard');
        };
        
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Sincronizar al cargar la página

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Efecto para cargar la configuración del usuario desde Firestore
    useEffect(() => {
        if (!user) return;

        const settingsRef = doc(db, `artifacts/${appId}/users/${user.uid}/settings`, 'app_config');
        const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                setSettings(docSnap.data());
            } else {
                // Configuración por defecto si no existe
                setSettings({ inventoryMethod: 'cpp', posProvider: 'none' });
            }
        });

        return () => unsubscribe();
    }, [user]);

    // --- Funciones Auxiliares (pasadas como props) ---
    const navigateTo = (newView) => { window.location.hash = newView; };
    const toggleTheme = () => setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    const showModal = (message, type = "info", onConfirm = null) => setModal({ message, type, onConfirm });
    const closeModal = () => setModal(null);

    // --- Funciones CRUD (Create, Read, Update, Delete) ---
    const handleAddProduct = async (newProduct) => {
        if (!user) return;
        try {
            await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/products`), newProduct);
            showModal("Producto añadido con éxito.", "info");
            navigateTo("products");
        } catch (err) {
            showModal("Error al añadir el producto.", "error");
        }
    };

    const handleUpdateProduct = async (updatedProduct) => {
        if (!user) return;
        try {
            const { id, ...dataToUpdate } = updatedProduct;
            await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/products`, id), dataToUpdate);
            showModal("Producto actualizado con éxito.", "info");
            navigateTo("products");
            setSelectedProduct(null);
        } catch (err) {
            showModal("Error al actualizar el producto.", "error");
        }
    };

    const handleDeleteProduct = (productId) => {
        if (!user) return;
        showModal("¿Estás seguro de que quieres eliminar este producto?", "error", async () => {
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/products`, productId));
                closeModal(); // Cierra el modal de confirmación
                showModal("Producto eliminado.", "info");
            } catch (err) {
                closeModal();
                showModal("Error al eliminar el producto.", "error");
            }
        });
    };
    
    // --- Renderizado de la Aplicación ---
    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 dark:text-white">Cargando autenticación...</div>;
    }

    if (!user) {
        return <AuthScreen onLogin={loginWithEmail} onRegister={registerWithEmail} error={authError} />;
    }

    const renderContent = () => {
        // Muestra un mensaje de carga mientras se obtienen los datos o la configuración
        if (dataLoading || settings === null) {
            return <div className="text-center p-10 dark:text-gray-300">Cargando datos del inventario...</div>;
        }

        if (dataError) {
            return <div className="text-center p-10 text-red-500">{dataError}</div>;
        }

        // Objeto de props comunes para pasar a todos los componentes de las vistas
        // Esto evita dependencias circulares, ya que todo fluye hacia abajo.
        const commonProps = {
            products,
            userId: user.uid,
            db,
            appId,
            setView: navigateTo,
            showModal,
            closeModal,
            onBack: () => navigateTo('dashboard'),
            settings
        };

        switch (view) {
            case 'dashboard':
                return <Dashboard {...commonProps} movements={movements} />;
            case 'pos':
                // Aquí se usa Suspense como fallback mientras se carga el componente PointOfSale
                return (
                    <Suspense fallback={<div className="text-center p-10 dark:text-gray-300">Cargando Punto de Venta...</div>}>
                        <PointOfSale {...commonProps} />
                    </Suspense>
                );
            case 'products':
                return <ProductList {...commonProps} categories={categories} setSelectedProduct={setSelectedProduct} handleDeleteProduct={handleDeleteProduct} />;
            case 'add-product':
                return <ProductForm onSave={handleAddProduct} onCancel={() => navigateTo('products')} suppliers={suppliers} settings={settings} />;
            case 'edit-product':
                return <ProductForm productToEdit={selectedProduct} onSave={handleUpdateProduct} onCancel={() => navigateTo('products')} suppliers={suppliers} settings={settings} />;
            case 'adjust-stock':
                return <StockAdjustment {...commonProps} />;
            case 'movements':
                return <MovementHistory movements={movements} onBack={() => navigateTo('dashboard')} />;
            case 'reports':
                return <Reports products={products} movements={movements} onBack={() => navigateTo('dashboard')} />;
            case 'expiration-report':
                return <ExpirationReport products={products} onBack={() => navigateTo('dashboard')} />;
            case 'settings':
                return <Settings {...commonProps} />;
            case 'suppliers':
                return <Suppliers {...commonProps} suppliers={suppliers} />;
            default:
                return <Dashboard {...commonProps} movements={movements} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-sans flex flex-col">
            <Navbar setView={navigateTo} currentView={view} onLogout={logout} theme={theme} toggleTheme={toggleTheme} />
            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="text-right text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Usuario: <span className="font-semibold">{user.email}</span>
                </div>
                {renderContent()}
            </main>
            {modal && <ModalMessage {...modal} onClose={closeModal} onConfirm={modal.onConfirm} />}
        </div>
    );
};

export default App;

