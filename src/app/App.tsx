import { Routes, Route } from "react-router-dom";
import { useAuth } from "../state/useAuth";
import { loginWithEmail, logoutUser } from "../firebase/auth";
import PageShell from "../layout/PageShell";
import Home from "../home/Home";
import MarketPage from "../market/MarketPage";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleLogin = async () => {
    await loginWithEmail("test@predex.com", "Raiders1");
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <PageShell
      firebaseUserId={user?.uid ?? null}
      onLogin={handleLogin}
      onLogout={handleLogout}
    >
      <Routes>
        <Route
          path="/"
          element={<Home currentUser={user?.uid ?? null} />}
        />

        <Route
          path="/market/:marketId"
          element={<MarketPage currentUser={user?.uid ?? null} />}
        />
      </Routes>
    </PageShell>
  );
}