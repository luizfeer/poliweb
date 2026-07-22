import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import {
  buildPropertyPricingKey,
  formatCentsAsCurrency,
  formatCentsAsInputValue,
  LISTING_TYPE_LABELS,
  LISTING_TYPES,
  normalizeRealEstatePricingConfig,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPES,
  REAL_ESTATE_MODULE_KEY,
} from '@/lib/real-estate/pricing';
import { createClient } from '@/lib/supabase/server';
import { updateRealEstatePricingAction } from './actions';

export default async function RealEstatePricingPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const supabase = await createClient();
  const { data: moduleConfig } = await supabase
    .from('city_modules')
    .select('config')
    .eq('city_id', city.id)
    .eq('module_key', REAL_ESTATE_MODULE_KEY)
    .maybeSingle();

  const pricing = normalizeRealEstatePricingConfig(moduleConfig?.config ?? null);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Precos de imoveis</h1>
        <p className="text-muted-foreground">
          Ajuste os valores cobrados de particulares por finalidade e tipo de imovel em {city.name}.
        </p>
      </header>

      <form action={updateRealEstatePricingAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pagamento</CardTitle>
            <CardDescription>
              Com o pagamento desligado, o fluxo usa status sem cobranca. A mesma configuracao sera usada pelo
              gateway quando a API de pagamento entrar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label className="w-fit">
              <input name="payment_active" type="checkbox" defaultChecked={pricing.paymentActive} />
              Cobrar antes de enviar para aprovacao
            </Label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tabela por tipo</CardTitle>
            <CardDescription>
              Valores em reais. Use 0 para cortesia padrao em alguma combinacao.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="w-56 py-2 pr-3 font-medium">Tipo</th>
                    {LISTING_TYPES.map((listingType) => (
                      <th key={listingType} className="py-2 pr-3 font-medium">
                        {LISTING_TYPE_LABELS[listingType]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PROPERTY_TYPES.map((propertyType) => (
                    <tr key={propertyType} className="border-b last:border-0">
                      <th className="py-2 pr-3 text-left font-medium">
                        {PROPERTY_TYPE_LABELS[propertyType]}
                      </th>
                      {LISTING_TYPES.map((listingType) => {
                        const key = buildPropertyPricingKey(listingType, propertyType);
                        const value = pricing.privateListingFeesCents[key];

                        return (
                          <td key={key} className="py-2 pr-3">
                            <div className="space-y-1">
                              <Input
                                aria-label={`${PROPERTY_TYPE_LABELS[propertyType]} - ${LISTING_TYPE_LABELS[listingType]}`}
                                inputMode="decimal"
                                name={`fee__${key}`}
                                defaultValue={formatCentsAsInputValue(value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                {formatCentsAsCurrency(value)}
                              </p>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Salvar precos</Button>
        </div>
      </form>
    </div>
  );
}
