import { Button, Popover } from "antd";
import { formatCNPJ } from "cnpj-cpf-validator";
import { formatDate } from "../../../lib";
import type { User } from "../../../types";

export function UserFarmsCell({ user }: { user: User }) {
  const firstFarm = user.properties[0];
  const additionalCount = user.properties.length - 1;

  if (!firstFarm) {
    return <span className="text-sm text-brand-forest">Sem fazenda vinculada</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-sm text-brand-ink">{firstFarm.name}</span>
        {additionalCount > 0 && (
          <Popover
            trigger="click"
            placement="bottomLeft"
            title={`Fazendas vinculadas (${user.properties.length})`}
            content={
              <ul className="m-0 max-h-72 max-w-xs list-none space-y-3 overflow-y-auto p-0" aria-label="Fazendas vinculadas">
                {user.properties.map((farm) => (
                  <li key={farm.id} className="flex flex-col gap-1 break-words">
                    <span className="font-medium text-brand-ink">{farm.name}</span>
                    <span className="text-xs text-brand-forest">
                      {farm.cnpj ? formatCNPJ(farm.cnpj) : "CNPJ não informado"}
                    </span>
                    <span className="text-xs text-brand-forest">Vinculado em {formatDate(farm.linkDate)}</span>
                  </li>
                ))}
              </ul>
            }
          >
            <Button size="small" aria-label={`Mostrar as ${user.properties.length} fazendas de ${user.name}`}>
              +{additionalCount}
            </Button>
          </Popover>
        )}
      </div>
      {additionalCount === 0 && (
        <>
          <span className="text-xs text-brand-forest">
            {firstFarm.cnpj ? formatCNPJ(firstFarm.cnpj) : "CNPJ não informado"}
          </span>
          <span className="text-xs text-brand-forest">Vinculado em {formatDate(firstFarm.linkDate)}</span>
        </>
      )}
    </div>
  );
}
