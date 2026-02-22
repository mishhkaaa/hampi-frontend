import { useQuery } from "@tanstack/react-query";
import { permissionsApi } from "@/lib/api/permissions";

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data } = await permissionsApi.getAll();
      return data.data;
    },
  });
}
