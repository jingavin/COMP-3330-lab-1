import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";

export default function Home() {
  const { data, error, isError, refetch, isFetching } = useQuery({
    queryKey: ["secureProfile"],
    queryFn: async () => {
      const res = await fetch("/api/secure/profile", {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: false,
  });

  return (
    <div>
      <Button onClick={() => refetch()} disabled={isFetching}>
        {isFetching ? "Loading..." : "Get Secure Profile"}
      </Button>

      {isError && <p className="text-red-500">Error: {(error as Error).message}</p>}

      {data && <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
