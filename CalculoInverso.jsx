import React, { useState, useCallback, useEffect } from "react";
import {
  Button,
  Card,
  Input,
  Label,
  Text,
  Switch,
} from "@fluentui/react-components";

// Componente para el cálculo inverso
export function CalculoInverso({ state, updateState, baseDatos }) {
  // Estado para el sueldo líquido objetivo
  const [sueldoLiquidoObjetivo, setSueldoLiquidoObjetivo] = useState("");
  // Nuevo estado para bonos no imponibles
  const [bonosNoImponibles, setBonosNoImponibles] = useState("");
  const [calculando, setCalculando] = useState(false);
  const [resultadoCalculado, setResultadoCalculado] = useState(null);
  const [error, setError] = useState("");
  // Estado para controlar si se muestra el campo de porcentaje personalizado
  const [mostrarMutualPersonalizado, setMostrarMutualPersonalizado] = useState(
    state.tipoIndustria === "10"
  );
  
  // Extraer datos relevantes del estado
  const {
    afpSeleccionada,
    saludSeleccionada,
    tipoContrato,
    planUf,
    haberesNoImponibles,
    otrosDescuentos,
    mesActual,
    tipoIndustria,
    mutualPersonalizado
  } = state;
  
  // Formateo para mostrar moneda
  const formatearMoneda = useCallback((valor) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(valor);
  }, []);
  
  // Formatear valor de entrada de moneda para sueldo líquido
  const handleFormatearMoneda = useCallback((e) => {
    let valorInput = e.target.value;
    
    if (valorInput === "") {
      setSueldoLiquidoObjetivo("");
      return;
    }
    
    // Eliminar caracteres no numéricos
    const valorLimpio = valorInput.replace(/\D/g, "");
    
    if (valorLimpio === "") {
      setSueldoLiquidoObjetivo("");
      return;
    }
    
    try {
      const valorNumerico = parseInt(valorLimpio, 10);
      
      if (!isNaN(valorNumerico)) {
        // Formatear con separadores de miles
        const valorFormateado = new Intl.NumberFormat("es-CL", {
          maximumFractionDigits: 0,
          minimumFractionDigits: 0
        }).format(valorNumerico);
        
        setSueldoLiquidoObjetivo(valorFormateado);
      } else {
        setSueldoLiquidoObjetivo(valorLimpio);
      }
    } catch (err) {
      setSueldoLiquidoObjetivo(valorLimpio);
    }
  }, []);

  // Formatear valor de entrada de moneda para bonos no imponibles
  const handleFormatearBonosNoImponibles = useCallback((e) => {
    let valorInput = e.target.value;
    
    if (valorInput === "") {
      setBonosNoImponibles("");
      return;
    }
    
    // Eliminar caracteres no numéricos
    const valorLimpio = valorInput.replace(/\D/g, "");
    
    if (valorLimpio === "") {
      setBonosNoImponibles("");
      return;
    }
    
    try {
      const valorNumerico = parseInt(valorLimpio, 10);
      
      if (!isNaN(valorNumerico)) {
        // Formatear con separadores de miles
        const valorFormateado = new Intl.NumberFormat("es-CL", {
          maximumFractionDigits: 0,
          minimumFractionDigits: 0
        }).format(valorNumerico);
        
        setBonosNoImponibles(valorFormateado);
      } else {
        setBonosNoImponibles(valorLimpio);
      }
    } catch (err) {
      setBonosNoImponibles(valorLimpio);
    }
  }, []);

  // Calcular la suma de haberes no imponibles
  const totalHaberesNoImponibles = Object.values(haberesNoImponibles).reduce(
    (sum, valor) => sum + (parseInt(valor.toString().replace(/\D/g, "")) || 0),
    0
  );

  // Calcular la suma de otros descuentos
  const totalOtrosDescuentos = Object.values(otrosDescuentos).reduce(
    (sum, valor) => sum + (parseInt(valor.toString().replace(/\D/g, "")) || 0),
    0
  );

  // Obtener información del mes seleccionado
  const mesInfo = baseDatos.meses.find(m => m.id === parseInt(mesActual)) || baseDatos.meses[2]; // Default a marzo
  
  // Obtener información de AFP y Salud seleccionados
  const afpInfo = baseDatos.afp.find(a => a.id === parseInt(afpSeleccionada)) || null;
  const saludInfo = baseDatos.salud.find(s => s.id === parseInt(saludSeleccionada)) || null;
  
  // Validación antes del cálculo
  const validarEntradas = useCallback(() => {
    if (!sueldoLiquidoObjetivo) {
      setError("Debe ingresar el sueldo líquido objetivo");
      return false;
    }
    
    if (!afpSeleccionada) {
      setError("Debe seleccionar una AFP");
      return false;
    }
    
    if (!saludSeleccionada) {
      setError("Debe seleccionar un sistema de salud");
      return false;
    }
    
    const sueldoLiquidoNumerico = parseInt(sueldoLiquidoObjetivo.replace(/\D/g, "")) || 0;
    if (sueldoLiquidoNumerico <= 0) {
      setError("El sueldo líquido debe ser mayor a cero");
      return false;
    }
    
    // Validar que los bonos no imponibles no excedan el sueldo líquido objetivo
    const bonosNoImponiblesNumerico = parseInt(bonosNoImponibles.replace(/\D/g, "")) || 0;
    if (bonosNoImponiblesNumerico >= sueldoLiquidoNumerico) {
      setError("Los bonos no imponibles no pueden ser mayores o iguales al sueldo líquido objetivo");
      return false;
    }
    
    setError("");
    return true;
  }, [sueldoLiquidoObjetivo, bonosNoImponibles, afpSeleccionada, saludSeleccionada]);
  
  // Función auxiliar para calcular el líquido a partir de un sueldo bruto
  const calcularLiquido = useCallback((sueldoBruto, afpInfo, saludInfo) => {
    // Parámetros generales
    const { cotizacionObligatoria, seguroCesantia, topeImponible, uf, utm } = baseDatos.parametros;
    
    // Aplicar tope imponible
    const topeImponiblePesos = topeImponible.general * uf;
    const baseImponible = Math.min(sueldoBruto, topeImponiblePesos);
    
    // Calcular descuentos de AFP
    const cotizacionAfpObligatoria = baseImponible * (10 / 100);
    const comisionAfp = baseImponible * (afpInfo.comision / 100);
    
    // SIS: Este es un costo del empleador, NO afecta al trabajador ni sus descuentos
    // Se calcula aquí solo para informarlo, pero no se usa en descuentos ni base imponible para impuestos
    const sis = baseImponible * (afpInfo.sis / 100);
    
    // Calcular descuentos de salud
    let cotizacionSalud = baseImponible * (saludInfo.cotizacion / 100);
    let cotizacionAdicionalSalud = 0;
    
    if (saludInfo.tipo === "isapre" && planUf) {
      cotizacionAdicionalSalud = planUf * uf;
    }
    
    // Calcular seguro de cesantía
    const porcentajeSeguroCesantia = tipoContrato === "indefinido" 
      ? seguroCesantia.trabajador.indefinido 
      : seguroCesantia.trabajador.plazoFijo;
    
    const seguroCesantiaTrabajador = baseImponible * (porcentajeSeguroCesantia / 100);
    
    // APV (si existe y está implementado en el cálculo inverso)
    let apv = 0;
    
    // Total descuentos previsionales - IMPORTANTE: No incluye SIS porque es costo del empleador
    const totalDescuentosPrevisionales = cotizacionAfpObligatoria + comisionAfp + 
                                        cotizacionSalud + cotizacionAdicionalSalud + 
                                        seguroCesantiaTrabajador + apv;
    
    // Calcular impuesto - IMPORTANTE: La base imponible NO considera el SIS porque lo paga el empleador
    // Base imponible = Sueldo bruto - Descuentos previsionales (sin incluir SIS)
    const baseImponibleImpuesto = sueldoBruto - totalDescuentosPrevisionales;
    const baseImponibleUTM = baseImponibleImpuesto / mesInfo.utm;
    
    // Encontrar tramo de impuesto
    const tramo = baseDatos.iut.find(
      t => baseImponibleUTM > t.desde && baseImponibleUTM <= t.hasta
    ) || baseDatos.iut[0];
    
    // Calcular impuesto
    let impuesto = ((baseImponibleUTM * tramo.factor) - tramo.rebaja) * mesInfo.utm;
    impuesto = impuesto < 10 ? 0 : impuesto;
    
    // Calcular líquido - MODIFICADO: Ya no resta SIS, no incluye haberes no imponibles
    const liquido = sueldoBruto - totalDescuentosPrevisionales - impuesto - totalOtrosDescuentos;
    
    // Calcular porcentaje total de descuentos
    const porcentajeTotalDescuentos = (totalDescuentosPrevisionales + impuesto + totalOtrosDescuentos) / sueldoBruto;
    
    // Calcular costos del empleador
    // Seguro de cesantía (parte del empleador)
    const porcentajeSeguroCesantiaEmpleador = tipoContrato === "indefinido" 
      ? seguroCesantia.empleador.indefinido 
      : seguroCesantia.empleador.plazoFijo;
    
    const seguroCesantiaEmpleador = baseImponible * (porcentajeSeguroCesantiaEmpleador / 100);
    
    // SIS Empleador - Ahora claramente como costo del empleador
    const sisEmpleador = baseImponible * (afpInfo.sis / 100);
    
    // Mutual de Seguridad - MODIFICADO para usar directamente el valor personalizado si es industria 10
    const industria = baseDatos.mutualSeguridad.find(i => i.id === parseInt(tipoIndustria)) || baseDatos.mutualSeguridad[0];
    
    // Si es personalizado, usar el valor ingresado por el usuario SIN SUMAR la tasa base
    let tasaTotal;
    if (industria.id === 10) {
      tasaTotal = parseFloat(mutualPersonalizado || 0);
    } else {
      tasaTotal = industria.tasa + industria.adicional;
    }
    
    const mutualSeguridad = baseImponible * (tasaTotal / 100);
    
    // Costo total empleador
    const costoTotal = sueldoBruto + seguroCesantiaEmpleador + sisEmpleador + mutualSeguridad;
    
    // Retornar resultado
    return {
      liquido: Math.round(liquido),
      descuentos: {
        previsionales: Math.round(totalDescuentosPrevisionales),
        impuesto: Math.round(impuesto),
        otros: totalOtrosDescuentos,
        total: Math.round(totalDescuentosPrevisionales + impuesto + totalOtrosDescuentos),
        porcentajeTotal: porcentajeTotalDescuentos
      },
      detalle: {
        afp: {
          cotizacionObligatoria: Math.round(cotizacionAfpObligatoria),
          comision: Math.round(comisionAfp),
          sis: Math.round(sis) // Mantenemos para información
        },
        salud: {
          cotizacionBase: Math.round(cotizacionSalud),
          adicional: Math.round(cotizacionAdicionalSalud)
        },
        seguroCesantia: Math.round(seguroCesantiaTrabajador),
        impuesto: {
          baseImponible: Math.round(baseImponibleImpuesto),
          tramo: tramo
        }
      },
      empleador: {
        seguroCesantia: Math.round(seguroCesantiaEmpleador),
        sis: Math.round(sisEmpleador), // SIS como costo del empleador
        mutual: {
          valor: Math.round(mutualSeguridad),
          industria: industria,
          tasa: tasaTotal
        },
        costoTotal: Math.round(costoTotal)
      }
    };
  }, [
    baseDatos.parametros,
    baseDatos.iut,
    baseDatos.mutualSeguridad,
    mesInfo.utm,
    totalOtrosDescuentos,
    tipoContrato,
    tipoIndustria,
    planUf,
    mutualPersonalizado
  ]);
  
  // Función para calcular el sueldo bruto necesario para obtener el líquido deseado
  const calcularSueldoBruto = useCallback(() => {
    if (!validarEntradas()) {
      return;
    }
    
    setCalculando(true);
    setError("");
    
    try {
      // Obtener el sueldo líquido objetivo como número
      const sueldoLiquidoNumerico = parseInt(sueldoLiquidoObjetivo.replace(/\D/g, "")) || 0;
      
      // Obtener los bonos no imponibles como número
      const bonosNoImponiblesNumerico = parseInt(bonosNoImponibles.replace(/\D/g, "")) || 0;
      
      // Calcular el líquido que debe generarse con el sueldo base imponible
      // (restamos los bonos no imponibles del líquido objetivo)
      const liquidoSinBonos = sueldoLiquidoNumerico - bonosNoImponiblesNumerico;
      
      // Obtener información de AFP y salud
      const afpInfo = baseDatos.afp.find(a => a.id === parseInt(afpSeleccionada)) || null;
      const saludInfo = baseDatos.salud.find(s => s.id === parseInt(saludSeleccionada)) || null;
      
      if (!afpInfo || !saludInfo) {
        setError("Información de AFP o salud no disponible");
        setCalculando(false);
        return;
      }
      
      // Método de bisección para encontrar el sueldo bruto
      let min = liquidoSinBonos; // Estimación mínima inicial
      let max = liquidoSinBonos * 2; // Estimación máxima inicial
      let sueldoBruto = Math.floor((min + max) / 2);
      let iteraciones = 0;
      const maxIteraciones = 50; // Límite de iteraciones para evitar bucles infinitos
      
      while (iteraciones < maxIteraciones) {
        // Calcular descuentos y sueldo líquido resultante
        const { liquido, descuentos } = calcularLiquido(sueldoBruto, afpInfo, saludInfo);
        
        // Si estamos cerca del objetivo (sin bonos), terminar
        if (Math.abs(liquido - liquidoSinBonos) < 1000) {
          // Ajuste fino para acercarse más al objetivo
          const ajuste = Math.round((liquidoSinBonos - liquido) / (1 - descuentos.porcentajeTotal));
          sueldoBruto += ajuste;
          
          // Recalcular con el ajuste
          const resultadoFinal = calcularLiquido(sueldoBruto, afpInfo, saludInfo);
          
          // Guardar el resultado
          setResultadoCalculado({
            sueldoBase: sueldoBruto,
            bonosNoImponibles: bonosNoImponiblesNumerico,
            sueldoLiquido: resultadoFinal.liquido + bonosNoImponiblesNumerico, // Suma bonos al líquido
            liquidoSinBonos: resultadoFinal.liquido, // Líquido sin bonos (solo del sueldo base)
            descuentos: resultadoFinal.descuentos,
            detalle: resultadoFinal.detalle,
            empleador: resultadoFinal.empleador
          });
          
          setCalculando(false);
          return;
        }
        
        // Ajustar rango de búsqueda
        if (liquido < liquidoSinBonos) {
          min = sueldoBruto;
        } else {
          max = sueldoBruto;
        }
        
        // Nuevo valor a probar
        sueldoBruto = Math.floor((min + max) / 2);
        iteraciones++;
      }
      
      // Si llegamos aquí, no encontramos una solución precisa
      setError("No se pudo encontrar un sueldo bruto preciso después de múltiples intentos");
      setCalculando(false);
    } catch (err) {
      console.error("Error en cálculo inverso:", err);
      setError("Ocurrió un error en el cálculo");
      setCalculando(false);
    }
  }, [
    validarEntradas, 
    sueldoLiquidoObjetivo, 
    bonosNoImponibles,
    afpSeleccionada, 
    saludSeleccionada, 
    baseDatos.afp, 
    baseDatos.salud,
    calcularLiquido
  ]);
  
  // Aplicar el resultado calculado al estado de la calculadora
  const aplicarResultado = useCallback(() => {
    if (!resultadoCalculado) return;
    
    // Formatear el sueldo base calculado
    const sueldoBaseFormateado = new Intl.NumberFormat("es-CL", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(resultadoCalculado.sueldoBase);
    
    // Si hay bonos no imponibles, distribuirlos (mitad colación, mitad movilización)
    let colacion = "";
    let movilizacion = "";
    
    if (resultadoCalculado.bonosNoImponibles > 0) {
      // Dividir los bonos entre colación y movilización (50/50)
      const mitad = Math.floor(resultadoCalculado.bonosNoImponibles / 2);
      
      colacion = new Intl.NumberFormat("es-CL", {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
      }).format(mitad);
      
      movilizacion = new Intl.NumberFormat("es-CL", {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
      }).format(resultadoCalculado.bonosNoImponibles - mitad);
    }
    
    // Actualizar el estado con el sueldo base calculado y los bonos no imponibles
    updateState({
      haberesImponibles: {
        ...state.haberesImponibles,
        sueldoBase: sueldoBaseFormateado,
        horasExtras: "",
        bonosImponibles: "",
        comisiones: "",
        gratificacion: "",
        semanaCorrida: "",
        bonoVacaciones: ""
      },
      haberesNoImponibles: {
        ...state.haberesNoImponibles,
        colacion: colacion,
        movilizacion: movilizacion,
        asignacionFamiliar: "",
        viaticos: "",
        salaCuna: ""
      }
    });
    
    // Reiniciar el estado del componente
    setResultadoCalculado(null);
    setSueldoLiquidoObjetivo("");
    setBonosNoImponibles("");
  }, [resultadoCalculado, updateState, state.haberesImponibles, state.haberesNoImponibles]);

  // Actualizar el estado mostrarMutualPersonalizado cuando cambia tipoIndustria
  useEffect(() => {
    setMostrarMutualPersonalizado(tipoIndustria === "10");
  }, [tipoIndustria]);
  
  return (
    <div className="calculo-inverso-section">
      <Card className="card">
        <h3 className="card-title">Cálculo Inverso de Sueldo</h3>
        <Text style={{ marginBottom: '15px', textAlign: 'center', display: 'block' }}>
          Ingrese el sueldo líquido deseado, los bonos no imponibles y los parámetros para calcular el sueldo base necesario
        </Text>
        
        <div className="fieldset">
          <div className="legend">Sueldo Objetivo</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            <div className="input-group">
              <Label className="input-label" weight="semibold">Sueldo Líquido Objetivo ($)</Label>
              <Input
                size="large"
                value={sueldoLiquidoObjetivo}
                onChange={handleFormatearMoneda}
                appearance="outline"
                placeholder=""
                style={{ fontSize: '16px', height: '40px' }}
              />
            </div>
            
            <div className="input-group">
              <Label className="input-label" weight="semibold">Bonos No Imponibles ($)</Label>
              <Input
                size="large"
                value={bonosNoImponibles}
                onChange={handleFormatearBonosNoImponibles}
                appearance="outline"
                placeholder="Opcional"
                style={{ fontSize: '16px', height: '40px' }}
              />
              <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                Colación, movilización, etc.
              </div>
            </div>
          </div>
        </div>
        
        <div className="fieldset" style={{marginTop: '15px'}}>
          <div className="legend">Parámetros de Cálculo</div>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px'}}>
            <div className="input-group">
              <Label className="input-label">AFP</Label>
              <select
                className="dropdown"
                value={afpSeleccionada}
                onChange={(e) => updateState({ afpSeleccionada: e.target.value })}
              >
                <option value="">-- Seleccionar AFP --</option>
                {baseDatos.afp.map(afp => (
                  <option key={afp.id} value={afp.id}>
                    {afp.nombre} ({afp.comision.toFixed(2)}%)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="input-group">
              <Label className="input-label">Salud</Label>
              <select
                className="dropdown"
                value={saludSeleccionada}
                onChange={(e) => updateState({ saludSeleccionada: e.target.value })}
              >
                <option value="">-- Seleccionar Sistema de Salud --</option>
                {baseDatos.salud.map(salud => (
                  <option key={salud.id} value={salud.id}>
                    {salud.nombre} ({salud.tipo})
                  </option>
                ))}
              </select>
            </div>

            {/* Campo para plan en UF solo si se selecciona ISAPRE */}
            {saludInfo && saludInfo.tipo === "isapre" && (
              <div className="input-group">
                <Label className="input-label">Plan en UF</Label>
                <Input
                  size="small"
                  type="number"
                  min="0"
                  step="0.1"
                  value={planUf || ""}
                  onChange={(e) => {
                    const valor = parseFloat(e.target.value) || 0;
                    updateState({ planUf: valor });
                  }}
                  appearance="outline"
                  placeholder="Ej: 3.5"
                />
              </div>
            )}
            
            <div className="input-group">
              <Label className="input-label">Tipo de Contrato</Label>
              <select
                className="dropdown"
                value={tipoContrato}
                onChange={(e) => updateState({ tipoContrato: e.target.value })}
              >
                <option value="indefinido">Indefinido</option>
                <option value="plazoFijo">Plazo Fijo</option>
              </select>
            </div>
            
            <div className="input-group">
              <Label className="input-label">Mes de Cálculo</Label>
              <select
                className="dropdown"
                value={mesActual}
                onChange={(e) => updateState({ mesActual: e.target.value })}
              >
                {baseDatos.meses.map(mes => (
                  <option key={mes.id} value={mes.id}>
                    {mes.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="input-group">
              <Label className="input-label">Tipo de Industria (Mutual)</Label>
              <select
                className="dropdown"
                value={tipoIndustria || "1"}
                onChange={(e) => {
                  const newValue = e.target.value;
                  updateState({ tipoIndustria: newValue });
                  // Mostrar campo personalizado si se selecciona "Personalizado"
                  setMostrarMutualPersonalizado(newValue === "10");
                  if (newValue !== "10") {
                    updateState({ mostrarMutualPersonalizado: false });
                  } else {
                    updateState({ mostrarMutualPersonalizado: true });
                  }
                }}
              >
                {baseDatos.mutualSeguridad.map(industria => (
                  <option key={industria.id} value={industria.id}>
                    {industria.nombre} ({industria.id === 10 ? "Personalizado" : (industria.tasa + industria.adicional).toFixed(2) + "%"})
                  </option>
                ))}
              </select>
            </div>

            {/* Campo para porcentaje personalizado de Mutual */}
            {mostrarMutualPersonalizado && (
              <div className="input-group">
                <Label className="input-label">Porcentaje Personalizado (%)</Label>
                <Input
                  size="small"
                  type="number"
                  min="0"
                  step="0.01"
                  value={mutualPersonalizado || "0"}
                  onChange={(e) => {
                    const valor = parseFloat(e.target.value) || 0;
                    updateState({ mutualPersonalizado: valor });
                  }}
                  appearance="outline"
                  placeholder="Ej: 1.7"
                />
                <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                  El porcentaje total será: {parseFloat(mutualPersonalizado || 0).toFixed(2)}%
                </div>
              </div>
            )}
          </div>
        </div>
        
        {error && (
          <Text className="error-text" style={{ marginTop: '10px', display: 'block' }}>
            {error}
          </Text>
        )}
        
        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center' }}>
          <Button
            appearance="primary"
            onClick={calcularSueldoBruto}
            disabled={calculando}
            style={{ padding: '0 20px', height: '40px' }}
          >
            {calculando ? "Calculando..." : "Calcular Sueldo Base"}
          </Button>
        </div>
        
        {resultadoCalculado && (
          <div className="resultado-calculo-inverso" style={{ marginTop: '20px' }}>
            <div className="fieldset">
              <div className="legend">Resultado del Cálculo Inverso</div>
              
              <div className="resultado-linea" style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', padding: '5px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Sueldo base requerido:</span>
                <span className="valor">{formatearMoneda(resultadoCalculado.sueldoBase)}</span>
              </div>
              
              {resultadoCalculado.bonosNoImponibles > 0 && (
                <div className="resultado-linea" style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', padding: '5px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span>Bonos no imponibles:</span>
                  <span className="valor">{formatearMoneda(resultadoCalculado.bonosNoImponibles)}</span>
                </div>
              )}
              
              <div className="resultado-linea" style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', padding: '5px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Sueldo líquido resultante:</span>
                <span className="valor">{formatearMoneda(resultadoCalculado.sueldoLiquido)}</span>
              </div>
              
              <div className="desglose-descuentos" style={{ marginTop: '15px' }}>
                <Text weight="semibold" style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                  Desglose de descuentos:
                </Text>
                
                <div style={{ fontSize: '13px', marginLeft: '10px' }}>
                  <div style={{ margin: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>AFP Cotización (10%):</span>
                    <span>{formatearMoneda(resultadoCalculado.detalle.afp.cotizacionObligatoria)}</span>
                  </div>
                  <div style={{ margin: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>AFP Comisión:</span>
                    <span>{formatearMoneda(resultadoCalculado.detalle.afp.comision)}</span>
                  </div>

                  <div style={{ margin: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Salud base (7%):</span>
                    <span>{formatearMoneda(resultadoCalculado.detalle.salud.cotizacionBase)}</span>
                  </div>
                  {resultadoCalculado.detalle.salud.adicional > 0 && (
                    <div style={{ margin: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Adicional ISAPRE:</span>
                      <span>{formatearMoneda(resultadoCalculado.detalle.salud.adicional)}</span>
                    </div>
                  )}
                  <div style={{ margin: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Seguro Cesantía:</span>
                    <span>{formatearMoneda(resultadoCalculado.detalle.seguroCesantia)}</span>
                  </div>
                  <div style={{ margin: '5px 0', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>Total Previsional:</span>
                    <span>{formatearMoneda(resultadoCalculado.descuentos.previsionales)}</span>
                  </div>
                  <div style={{ margin: '8px 0', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                    <span>Impuesto:</span>
                    <span>{formatearMoneda(resultadoCalculado.descuentos.impuesto)}</span>
                  </div>
                  <div style={{ margin: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Otros descuentos:</span>
                    <span>{formatearMoneda(resultadoCalculado.descuentos.otros)}</span>
                  </div>
                  <div style={{ margin: '8px 0', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '8px', fontWeight: 'bold' }}>
                    <span>Total Descuentos:</span>
                    <span>{formatearMoneda(resultadoCalculado.descuentos.total)}</span>
                  </div>
                </div>
              </div>
              
              <div className="desglose-empleador" style={{ marginTop: '15px' }}>
                <Text weight="semibold" style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                  Costos para el Empleador:
                </Text>
                
                <div style={{ fontSize: '13px', marginLeft: '10px' }}>
                  <div style={{ margin: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Sueldo Bruto:</span>
                    <span>{formatearMoneda(resultadoCalculado.sueldoBase)}</span>
                  </div>
                  {resultadoCalculado.bonosNoImponibles > 0 && (
                    <div style={{ margin: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Bonos No Imponibles:</span>
                      <span>{formatearMoneda(resultadoCalculado.bonosNoImponibles)}</span>
                    </div>
                  )}
                  <div style={{ margin: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Seguro Cesantía Empleador:</span>
                    <span>{formatearMoneda(resultadoCalculado.empleador.seguroCesantia)}</span>
                  </div>
                  <div style={{ margin: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>SIS Empleador (1,38%):</span>
                    <span>{formatearMoneda(resultadoCalculado.empleador.sis)}</span>
                  </div>
                  <div style={{ margin: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Mutual de Seguridad ({resultadoCalculado.empleador.mutual.tasa.toFixed(2)}%):</span>
                    <span>{formatearMoneda(resultadoCalculado.empleador.mutual.valor)}</span>
                  </div>
                  <div style={{ margin: '8px 0', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '8px', fontWeight: 'bold' }}>
                    <span>Costo Total Empresa:</span>
                    <span>{formatearMoneda(resultadoCalculado.empleador.costoTotal + resultadoCalculado.bonosNoImponibles)}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                <Button
                  appearance="primary"
                  onClick={aplicarResultado}
                  style={{ width: '100%', maxWidth: '300px' }}
                >
                  Aplicar Resultados a la Calculadora
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}