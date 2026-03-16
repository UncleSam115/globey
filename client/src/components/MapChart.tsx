import { memo, useState, useCallback } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const numericToIso2: Record<string, string> = {
  "004":"AF","008":"AL","012":"DZ","024":"AO","032":"AR","036":"AU","040":"AT",
  "050":"BD","056":"BE","064":"BT","068":"BO","070":"BA","072":"BW","076":"BR",
  "100":"BG","104":"MM","108":"BI","116":"KH","120":"CM","124":"CA","140":"CF",
  "144":"LK","148":"TD","152":"CL","156":"CN","170":"CO","178":"CG","180":"CD",
  "188":"CR","191":"HR","192":"CU","196":"CY","203":"CZ","208":"DK","214":"DO",
  "218":"EC","818":"EG","222":"SV","226":"GQ","232":"ER","233":"EE","231":"ET",
  "238":"FK","242":"FJ","246":"FI","250":"FR","266":"GA","270":"GM","268":"GE",
  "276":"DE","288":"GH","300":"GR","304":"GL","320":"GT","324":"GN","328":"GY",
  "332":"HT","340":"HN","348":"HU","352":"IS","356":"IN","360":"ID","364":"IR",
  "368":"IQ","372":"IE","376":"IL","380":"IT","384":"CI","388":"JM","392":"JP",
  "400":"JO","398":"KZ","404":"KE","408":"KP","410":"KR","414":"KW","417":"KG",
  "418":"LA","428":"LV","422":"LB","426":"LS","430":"LR","434":"LY","440":"LT",
  "442":"LU","450":"MG","454":"MW","458":"MY","466":"ML","478":"MR","484":"MX",
  "496":"MN","498":"MD","504":"MA","508":"MZ","516":"NA","524":"NP","528":"NL",
  "540":"NC","554":"NZ","558":"NI","562":"NE","566":"NG","578":"NO","512":"OM",
  "586":"PK","591":"PA","598":"PG","600":"PY","604":"PE","608":"PH","616":"PL",
  "620":"PT","630":"PR","634":"QA","642":"RO","643":"RU","646":"RW","682":"SA",
  "686":"SN","688":"RS","694":"SL","702":"SG","703":"SK","705":"SI","706":"SO",
  "710":"ZA","724":"ES","736":"SD","740":"SR","748":"SZ","752":"SE",
  "756":"CH","760":"SY","158":"TW","762":"TJ","834":"TZ","764":"TH","768":"TG",
  "780":"TT","788":"TN","792":"TR","795":"TM","800":"UG","804":"UA","784":"AE",
  "826":"GB","840":"US","858":"UY","860":"UZ","862":"VE","704":"VN","887":"YE",
  "894":"ZM","716":"ZW","010":"AQ","-99":"CY","275":"PS","732":"EH",
};

const iso2ToName: Record<string, string> = {
  "AF":"Afghanistan","AL":"Albania","DZ":"Algeria","AO":"Angola","AR":"Argentina",
  "AU":"Australia","AT":"Austria","BD":"Bangladesh","BE":"Belgium","BT":"Bhutan",
  "BO":"Bolivia","BA":"Bosnia & Herzegovina","BW":"Botswana","BR":"Brazil",
  "BG":"Bulgaria","MM":"Myanmar","BI":"Burundi","KH":"Cambodia","CM":"Cameroon",
  "CA":"Canada","CF":"Central African Rep.","LK":"Sri Lanka","TD":"Chad","CL":"Chile",
  "CN":"China","CO":"Colombia","CG":"Congo","CD":"DR Congo","CR":"Costa Rica",
  "HR":"Croatia","CU":"Cuba","CY":"Cyprus","CZ":"Czechia","DK":"Denmark",
  "DO":"Dominican Republic","EC":"Ecuador","EG":"Egypt","SV":"El Salvador",
  "GQ":"Equatorial Guinea","ER":"Eritrea","EE":"Estonia","ET":"Ethiopia",
  "FK":"Falkland Islands","FJ":"Fiji","FI":"Finland","FR":"France","GA":"Gabon",
  "GM":"Gambia","GE":"Georgia","DE":"Germany","GH":"Ghana","GR":"Greece",
  "GL":"Greenland","GT":"Guatemala","GN":"Guinea","GY":"Guyana","HT":"Haiti",
  "HN":"Honduras","HU":"Hungary","IS":"Iceland","IN":"India","ID":"Indonesia",
  "IR":"Iran","IQ":"Iraq","IE":"Ireland","IL":"Israel","IT":"Italy",
  "CI":"Ivory Coast","JM":"Jamaica","JP":"Japan","JO":"Jordan","KZ":"Kazakhstan",
  "KE":"Kenya","KP":"North Korea","KR":"South Korea","KW":"Kuwait","KG":"Kyrgyzstan",
  "LA":"Laos","LV":"Latvia","LB":"Lebanon","LS":"Lesotho","LR":"Liberia",
  "LY":"Libya","LT":"Lithuania","LU":"Luxembourg","MG":"Madagascar","MW":"Malawi",
  "MY":"Malaysia","ML":"Mali","MR":"Mauritania","MX":"Mexico","MN":"Mongolia",
  "MD":"Moldova","MA":"Morocco","MZ":"Mozambique","NA":"Namibia","NP":"Nepal",
  "NL":"Netherlands","NC":"New Caledonia","NZ":"New Zealand","NI":"Nicaragua",
  "NE":"Niger","NG":"Nigeria","NO":"Norway","OM":"Oman","PK":"Pakistan",
  "PA":"Panama","PG":"Papua New Guinea","PY":"Paraguay","PE":"Peru",
  "PH":"Philippines","PL":"Poland","PT":"Portugal","PR":"Puerto Rico","QA":"Qatar",
  "RO":"Romania","RU":"Russia","RW":"Rwanda","SA":"Saudi Arabia","SN":"Senegal",
  "RS":"Serbia","SL":"Sierra Leone","SG":"Singapore","SK":"Slovakia","SI":"Slovenia",
  "SO":"Somalia","ZA":"South Africa","ES":"Spain","SD":"Sudan","SR":"Suriname",
  "SZ":"Eswatini","SE":"Sweden","CH":"Switzerland","SY":"Syria","TW":"Taiwan",
  "TJ":"Tajikistan","TZ":"Tanzania","TH":"Thailand","TG":"Togo",
  "TT":"Trinidad & Tobago","TN":"Tunisia","TR":"Turkey","TM":"Turkmenistan",
  "UG":"Uganda","UA":"Ukraine","AE":"UAE","GB":"United Kingdom","US":"United States",
  "UY":"Uruguay","UZ":"Uzbekistan","VE":"Venezuela","VN":"Vietnam","YE":"Yemen",
  "ZM":"Zambia","ZW":"Zimbabwe","AQ":"Antarctica","PS":"Palestine","EH":"Western Sahara",
};

function getCountryCode(geo: any): string | null {
  if (geo.properties?.ISO_A2 && geo.properties.ISO_A2 !== "-99") {
    return geo.properties.ISO_A2;
  }
  const mapped = numericToIso2[String(geo.id)];
  return mapped || null;
}

function getCountryName(code: string): string {
  return iso2ToName[code] || code;
}

interface MapChartProps {
  visitedCountryCodes: string[];
  onToggleCountry?: (countryCode: string, countryName: string) => void;
  interactive?: boolean;
}

const MapChart = ({ visitedCountryCodes, onToggleCountry, interactive = false }: MapChartProps) => {
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null);

  const handleClick = useCallback((geo: any) => {
    if (!interactive || !onToggleCountry) return;
    const code = getCountryCode(geo);
    if (code) {
      onToggleCountry(code, getCountryName(code));
    }
  }, [interactive, onToggleCountry]);

  return (
    <div
      className="w-full aspect-[1.6] bg-blue-50/30 dark:bg-slate-800/50 rounded-2xl overflow-hidden border-2 border-border shadow-sm relative"
      data-testid="map-container"
    >
      {tooltip && (
        <div
          className="absolute z-10 px-3 py-1.5 bg-foreground text-background text-xs font-bold rounded-lg pointer-events-none shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y - 40 }}
          data-testid="map-tooltip"
        >
          {tooltip.name}
        </div>
      )}
      <ComposableMap projectionConfig={{ scale: 160, rotation: [-10, 0, 0] }}>
        <ZoomableGroup zoom={1} maxZoom={4}>
          <Geographies geography={geoUrl}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo) => {
                const code = getCountryCode(geo);
                const isVisited = code ? visitedCountryCodes.includes(code) : false;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isVisited ? "#10B981" : "#E2E8F0"}
                    stroke="#94a3b8"
                    strokeWidth={0.4}
                    onClick={() => handleClick(geo)}
                    onMouseEnter={(evt) => {
                      if (code) {
                        const rect = (evt.target as SVGElement).closest("div")?.getBoundingClientRect();
                        if (rect) {
                          setTooltip({
                            name: getCountryName(code),
                            x: evt.clientX - rect.left,
                            y: evt.clientY - rect.top,
                          });
                        }
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      default: { outline: "none", cursor: interactive ? "pointer" : "default" },
                      hover: {
                        fill: isVisited ? "#059669" : (interactive ? "#93C5FD" : "#CBD5E1"),
                        outline: "none",
                        cursor: interactive ? "pointer" : "default",
                      },
                      pressed: { outline: "none" },
                    }}
                    data-testid={code ? `map-country-${code}` : undefined}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};

export default memo(MapChart);
export { getCountryName };
