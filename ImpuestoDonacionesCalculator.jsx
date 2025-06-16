import React, { useState, useEffect } from "react";
import "./ImpuestoDonacionesCalculator.css";

import { 
  Button, 
  Card, 
  Input, 
  Label, 
  Switch,
  Text,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow
} from "@fluentui/react-components";

// Componente principal de la calculadora de donaciones
export function ImpuestoDonacionesCalculator({ state, updateState }) {
  // Formateo de moneda con precisión para impuestos
  const formatearImpuestoPreciso = (valor) => {
    const valorNumerico = typeof valor === 'number' ? valor : parseFloat(valor);
    
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valorNumerico);
  };

  // Formateo para porcentajes
  const formatearFactor = (factor) => {
    return (factor * 100).toFixed(1) + "%";
  };

  // Valores UTM por año y mes (valores ficticios, deben actualizarse con datos reales)
  const valoresUTM = {
    "2020": {
      "01": 49673, "02": 49723, "03": 50021, "04": 50221, 
      "05": 50372, "06": 50372, "07": 50322, "08": 50272, 
      "09": 50322, "10": 50372, "11": 50674, "12": 51029
    },
    "2021": {
      "01": 50978, "02": 51131, "03": 51489, "04": 51592, 
      "05": 51798, "06": 52005, "07": 52161, "08": 52213, 
      "09": 52631, "10": 52842, "11": 53476, "12": 54171
    },
    "2022": {
      "01": 54442, "02": 54878, "03": 55537, "04": 55704, 
      "05": 56762, "06": 57557, "07": 58248, "08": 58772, 
      "09": 59595, "10": 60310, "11": 60853, "12": 61157
    },
    "2023": {
      "01": 61769, "02": 61954, "03": 62450, "04": 62388, 
      "05": 63074, "06": 63263, "07": 63326, "08": 63199, 
      "09": 63452, "10": 63515, "11": 63960, "12": 64216
    },
    "2024": {
      "01": 64666, "02": 64343, "03": 64793, "04": 65182, 
      "05": 65443, "06": 65770, "07": 65967, "08": 65901, 
      "09": 66362, "10": 66561, "11": 66628, "12": 67294
    },
    "2025": {
      "01": 67429, "02": 67294, "03": 68034
    }
  };

  // Ya no necesitamos el cálculo de UTA para esta calculadora

  // Tramos de impuesto en UTM según la normativa
  const tramosImpuestoUTM = [
    { desde: 0, hasta: 960, factor: 0.01, rebaja: 0 },
    { desde: 960, hasta: 1920, factor: 0.025, rebaja: 14.4 },
    { desde: 1920, hasta: 3840, factor: 0.05, rebaja: 62.4 },
    { desde: 3840, hasta: 5760, factor: 0.075, rebaja: 158.4 },
    { desde: 5760, hasta: 7680, factor: 0.10, rebaja: 302.4 },
    { desde: 7680, hasta: 9600, factor: 0.15, rebaja: 686.4 },
    { desde: 9600, hasta: 14400, factor: 0.20, rebaja: 1166.4 },
    { desde: 14400, hasta: 999999, factor: 0.25, rebaja: 1886.4 }
  ];

  // Opciones de parentesco (actualizada para usar UTMs en lugar de UTAs)
  const opcionesParentesco = [
    { value: "conyuge", label: "Cónyuge", recargo: 0, deduccion: 60 }, // 5 UTA = 60 UTM
    { value: "ascendiente_legitimo", label: "Padre/Madre, Hijos", recargo: 0, deduccion: 60 }, // 5 UTA = 60 UTM
    { value: "hermanos", label: "Hermanos", recargo: 0.2, deduccion: 60 }, // 5 UTA = 60 UTM
    { value: "medio_hermanos", label: "Medio Hermanos", recargo: 0.2, deduccion: 60 }, // 5 UTA = 60 UTM
    { value: "sobrinos", label: "Sobrinos", recargo: 0.2, deduccion: 60 }, // 5 UTA = 60 UTM
    { value: "nietos", label: "Nietos", recargo: 0.2, deduccion: 60 }, // 5 UTA = 60 UTM
    { value: "primos", label: "Primos", recargo: 0.2, deduccion: 60 }, // 5 UTA = 60 UTM
    { value: "tios_abuelos", label: "Tíos Abuelos", recargo: 0.2, deduccion: 60 }, // 5 UTA = 60 UTM
    { value: "par_mas_lejano", label: "Parentesco más lejano", recargo: 0.5, deduccion: 0 },
    { value: "extranos", label: "Extraños", recargo: 0.5, deduccion: 0 }
  ];

  // Extraer estados del estado global
  const {
    montoDonacion,
    etiqueta,
    mostrarTablaReferencia,
    calculosRealizados,
    error,
    celdasExpandidas,
    selectedYear,
    selectedMonth,
    valorUTMActual,
    selectedParentesco
  } = state;
  
  // Función para actualizar un estado específico
  const updateStateValue = (key, value) => {
    updateState({ [key]: value });
  };
  
  // Meses para el dropdown
  const months = [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" }
  ];
  
  // Obtener años disponibles en los valores UTM
  const availableYears = Object.keys(valoresUTM).sort((a, b) => b - a); // Orden descendente
  
  // Función para expandir/contraer celdas en la tabla de resultados
  const toggleExpansion = (id, columna) => {
    updateStateValue("celdasExpandidas", {
      ...celdasExpandidas,
      [`${id}-${columna}`]: !celdasExpandidas[`${id}-${columna}`]
    });
  };

  // Formateo de moneda
  const formatearMoneda = (valor, conDecimales = false) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: conDecimales ? 2 : 0,
      minimumFractionDigits: conDecimales ? 2 : 0,
    }).format(valor);
  };
  
  // Formateo para valores UTM/UTA
  const formatearUTM = (valor) => {
    return new Intl.NumberFormat("es-CL", {
      maximumFractionDigits: 3,
      minimumFractionDigits: 3,
    }).format(valor);
  };

  // Obtener clase para celdas expandibles
  const getCeldaStyle = (id, columna) => {
    const key = `${id}-${columna}`;
    const isExpanded = celdasExpandidas[key];
    
    return isExpanded ? "celda-expandida" : "celda-normal";
  };
  
  // Obtener el valor de UTM para el año y mes seleccionados
  const getValorUTM = () => {
    try {
      // Verificar si existe el año y mes seleccionados
      if (valoresUTM[selectedYear] && valoresUTM[selectedYear][selectedMonth]) {
        const valorUTM = valoresUTM[selectedYear][selectedMonth];
        
        updateStateValue("valorUTMActual", valorUTM);
        
        return valorUTM;
      }
      // Si no existe, mostrar error
      updateStateValue("error", `No hay valor UTM disponible para ${months.find(m => m.value === selectedMonth)?.label} de ${selectedYear}`);
      return null;
    } catch (err) {
      console.error("Error al obtener valor UTM:", err);
      updateStateValue("error", "Error al obtener valores tributarios");
      return null;
    }
  };

  // Convertir la tabla de tramos a pesos
  const convertirTablaUTMaPesos = () => {
    if (!valorUTMActual) return [];
    
    return tramosImpuestoUTM.map(tramo => {
      return {
        ...tramo,
        desdePesos: tramo.desde * valorUTMActual,
        hastaPesos: tramo.hasta === 999999 ? Infinity : tramo.hasta * valorUTMActual,
        rebajaPesos: tramo.rebaja * valorUTMActual
      };
    });
  };

  // Obtener la tabla en pesos para visualización
  const tramosPesos = valorUTMActual ? convertirTablaUTMaPesos() : [];

  // Manejar cambio en el monto de donación
  const handleMonedaChange = (e, key) => {
    let valorInput = e.target.value;
    
    if (valorInput === "") {
      updateStateValue(key, "");
      return;
    }
    
    // Eliminar caracteres no numéricos
    const valorLimpio = valorInput.replace(/\D/g, "");
    
    if (valorLimpio === "") {
      updateStateValue(key, "");
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
        
        updateStateValue(key, valorFormateado);
      } else {
        updateStateValue(key, valorLimpio);
      }
    } catch (err) {
      console.error("Error al formatear:", err);
      updateStateValue(key, valorLimpio);
    }
    
    updateStateValue("error", "");
  };

  // Manejador específico para monto de donación
  const handleMontoDonacionChange = (e) => {
    handleMonedaChange(e, "montoDonacion");
  };

  // Función principal para calcular impuesto a la donación
  const calcularImpuestoDonacion = (montoDonacionPesos) => {
    try {
      // Validación inicial
      if (!valorUTMActual) return null;
      
      // Obtener datos del parentesco seleccionado
      const parentescoInfo = opcionesParentesco.find(
        p => p.value === selectedParentesco
      );
      
      if (!parentescoInfo) {
        updateStateValue("error", "Por favor seleccione un parentesco");
        return null;
      }
      
      // Convertir el monto a número
      const valorLimpio = montoDonacionPesos.toString().replace(/\D/g, "");
      const montoDonacionNum = parseFloat(valorLimpio);
      
      // Calcular deducción por parentesco en pesos
      const deduccionPesos = parentescoInfo.deduccion * valorUTMActual;
      
      // Calcular base imponible según parentesco
      let baseImponible = 0;
      if (parentescoInfo.deduccion > 0) {
        // Restar la deducción en UTM si aplica
        baseImponible = montoDonacionNum - deduccionPesos;
      } else {
        baseImponible = montoDonacionNum;
      }
      
      // Si la base imponible es negativa o cero, no hay impuesto
      if (baseImponible <= 0) {
        return {
          montoDonacion: montoDonacionNum,
          parentesco: parentescoInfo,
          baseImponible: 0,
          baseImponibleUTM: 0,
          tramo: null,
          impuestoBase: 0,
          tasaAplicable: 0,
          deduccion: 0,
          deduccionInicial: deduccionPesos, // Añadimos la deducción inicial
          deduccionInicialUTM: parentescoInfo.deduccion, // Añadimos la deducción inicial en UTM
          recargo: 0,
          impuestoFinal: 0,
          valorUTM: valorUTMActual,
          exento: true,
          fecha: `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
        };
      }
      
      // Convertir base imponible a UTM para determinar el tramo
      const baseImponibleUTM = baseImponible / valorUTMActual;
      
      // Encontrar tramo correspondiente
      const tramoCorrespondiente = tramosImpuestoUTM.find(
        tramo => baseImponibleUTM > tramo.desde && baseImponibleUTM <= tramo.hasta
      ) || tramosImpuestoUTM[0];
      
      // Calcular impuesto base
      const impuestoBase = (baseImponible * tramoCorrespondiente.factor) - 
                          (tramoCorrespondiente.rebaja * valorUTMActual);
      
      // Calcular recargo según parentesco
      const recargo = impuestoBase * parentescoInfo.recargo;
      
      // Calcular impuesto final
      const impuestoFinal = impuestoBase + recargo;
      
      // Retornar resultados
      return {
        montoDonacion: montoDonacionNum,
        parentesco: parentescoInfo,
        baseImponible: baseImponible,
        baseImponibleUTM: baseImponibleUTM,
        tramo: tramoCorrespondiente,
        impuestoBase: impuestoBase,
        tasaAplicable: tramoCorrespondiente.factor,
        deduccion: tramoCorrespondiente.rebaja * valorUTMActual,
        deduccionInicial: deduccionPesos, // Añadimos la deducción inicial
        deduccionInicialUTM: parentescoInfo.deduccion, // Añadimos la deducción inicial en UTM
        recargo: recargo,
        impuestoFinal: impuestoFinal,
        valorUTM: valorUTMActual,
        exento: false,
        fecha: `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
      };
    } catch (err) {
      console.error("Error en cálculo:", err);
      updateStateValue("error", "Ocurrió un error al calcular el impuesto");
      return null;
    }
  };

  // Agregar un nuevo cálculo a la lista
  const agregarCalculo = () => {
    if (!montoDonacion) {
      updateStateValue("error", "Por favor, ingrese un monto de donación válido");
      return;
    }
    
    if (!selectedParentesco) {
      updateStateValue("error", "Por favor, seleccione un tipo de parentesco");
      return;
    }
    
    try {
      const valorLimpio = montoDonacion.replace(/\D/g, "");
      
      if (!valorLimpio || isNaN(parseFloat(valorLimpio))) {
        updateStateValue("error", "Por favor, ingrese un valor numérico válido");
        return;
      }
      
      // Calcular el impuesto
      const resultado = calcularImpuestoDonacion(valorLimpio);
      if (!resultado) {
        return;
      }
      
      const nuevoCalculo = {
        id: Date.now(),
        etiqueta: etiqueta || `Cálculo ${calculosRealizados.length + 1}`,
        ...resultado
      };
      
      updateStateValue("calculosRealizados", [...calculosRealizados, nuevoCalculo]);
      updateStateValue("montoDonacion", "");
      updateStateValue("etiqueta", "");
      updateStateValue("error", "");
    } catch (err) {
      console.error("Error en cálculo:", err);
      updateStateValue("error", "Ocurrió un error al calcular el impuesto");
    }
  };

  // Eliminar un cálculo
  const eliminarCalculo = (id) => {
    updateStateValue("calculosRealizados", calculosRealizados.filter(calculo => calculo.id !== id));
  };

  // Limpiar todos los cálculos
  const limpiarCalculos = () => {
    updateStateValue("calculosRealizados", []);
    updateStateValue("montoDonacion", "");
    updateStateValue("etiqueta", "");
    updateStateValue("error", "");
  };

  // Actualizar valor UTM cuando cambie el mes o año
  useEffect(() => {
    getValorUTM();
  }, [selectedMonth, selectedYear]);

  // Renderizar tabla de referencia
  const renderTablaReferencia = () => {
    return (
      <div className="ref-panel">
        <Card className="card">
          <h4 className="card-title">
            Tabla de Referencia (Pesos)
          </h4>
          
          <div className="ref-table-container">
            <table className="ref-table">
              <thead>
                <tr>
                  <th className="ref-header-cell">Desde</th>
                  <th className="ref-header-cell">Hasta</th>
                  <th className="ref-header-cell">Factor</th>
                  <th className="ref-header-cell">Rebaja</th>
                </tr>
              </thead>
              <tbody>
                {tramosPesos.map((tramo, index) => {
                  return (
                    <tr key={index}>
                      <td className="ref-cell ref-cell-right">
                        {formatearMoneda(tramo.desdePesos)}
                      </td>
                      <td className="ref-cell ref-cell-right">
                        {tramo.hastaPesos === Infinity ? "y más" : formatearMoneda(tramo.hastaPesos)}
                      </td>
                      <td className="ref-cell ref-cell-center">
                        {formatearFactor(tramo.factor)}
                      </td>
                      <td className="ref-cell ref-cell-right">
                        {formatearMoneda(tramo.rebajaPesos)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Tabla de deducciones por parentesco */}
          <h4 className="card-title" style={{marginTop: '20px'}}>
            Deducciones por Parentesco
          </h4>
          
          <div className="ref-table-container">
            <table className="ref-table">
              <thead>
                <tr>
                  <th className="ref-header-cell">Parentesco</th>
                  <th className="ref-header-cell">Deducción (UTM)</th>
                  <th className="ref-header-cell">Deducción (Pesos)</th>
                  <th className="ref-header-cell">Recargo</th>
                </tr>
              </thead>
              <tbody>
                {opcionesParentesco.map((opcion, index) => {
                  return (
                    <tr key={index}>
                      <td className="ref-cell">
                        {opcion.label}
                      </td>
                      <td className="ref-cell ref-cell-center">
                        {opcion.deduccion}
                      </td>
                      <td className="ref-cell ref-cell-right">
                        {formatearMoneda(opcion.deduccion * valorUTMActual)}
                      </td>
                      <td className="ref-cell ref-cell-center">
                        {formatearFactor(opcion.recargo)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div style={{fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center'}}>
            Valores calculados con UTM de {formatearMoneda(valorUTMActual)} ({months.find(m => m.value === selectedMonth)?.label} {selectedYear})
          </div>
        </Card>
      </div>
    );
  };

  // Renderizado principal
  return (
    <div className="publish-container">
      <div className="header">
        <h2>Calculadora de Impuesto a las Donaciones</h2>
      </div>
      
      <div className="options-bar">
        <div className="switch-container switch-table-ref">
          <Text style={{fontSize: '13px'}}>Tabla de referencia</Text>
          <Switch 
            checked={mostrarTablaReferencia} 
            onChange={(e, data) => updateStateValue("mostrarTablaReferencia", data.checked)} 
          />
        </div>
      </div>
      
      <div className="layout">
        {/* Sección de configuración */}
        <div className="config-section">
          {/* Panel izquierdo: Entrada de datos */}
          <div className="input-panel">
            <Card className="card">
              <h3 className="card-title">Datos de la Donación</h3>
              
              <div className="fieldset">
                <div className="legend">Parámetros de cálculo</div>
                
                <div className="input-container">
                  <div className="input-group">
                    <Label className="input-label" htmlFor="montoDonacion" weight="semibold">Monto a Donar ($)</Label>
                    <Input
                      id="montoDonacion"
                      value={montoDonacion}
                      onChange={handleMontoDonacionChange}
                      placeholder=""
                      appearance="outline"
                    />
                  </div>
                  
                  <div className="input-group">
                    <Label className="input-label" weight="semibold">Parentesco</Label>
                    <select
                      className="dropdown"
                      value={selectedParentesco}
                      onChange={(e) => {
                        updateStateValue("selectedParentesco", e.target.value);
                        updateStateValue("error", "");
                      }}
                      style={{width: '100%'}}
                    >
                      <option value="">-- Seleccione parentesco --</option>
                      {opcionesParentesco.map(opcion => (
                        <option key={opcion.value} value={opcion.value}>
                          {opcion.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="input-group">
                    <Label className="input-label" weight="semibold">Período</Label>
                    <div className="date-container">
                      <select
                        className="dropdown"
                        value={selectedMonth}
                        onChange={(e) => {
                          updateStateValue("selectedMonth", e.target.value);
                          updateStateValue("error", "");
                        }}
                      >
                        {months.map(month => (
                          <option 
                            key={month.value} 
                            value={month.value}
                            disabled={!valoresUTM[selectedYear] || !valoresUTM[selectedYear][month.value]}
                          >
                            {month.label}
                          </option>
                        ))}
                      </select>
                      
                      <select
                        className="dropdown"
                        value={selectedYear}
                        onChange={(e) => {
                          updateStateValue("selectedYear", e.target.value);
                          updateStateValue("error", "");
                          
                          // Asegurar que el mes seleccionado es válido para el nuevo año
                          if (!valoresUTM[e.target.value] || !valoresUTM[e.target.value][selectedMonth]) {
                            // Seleccionar el primer mes disponible para ese año
                            const firstAvailableMonth = Object.keys(valoresUTM[e.target.value])[0];
                            updateStateValue("selectedMonth", firstAvailableMonth);
                          }
                        }}
                      >
                        {availableYears.map(year => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div style={{display: 'flex', gap: '10px', marginTop: '5px'}}>
                      {valorUTMActual && (
                        <Text size="small" className="info-box" style={{flex: 1}}>
                          UTM: {formatearMoneda(valorUTMActual)}
                        </Text>
                      )}
                    </div>
                  </div>
                  
                  <div className="input-group">
                    <Label className="input-label" htmlFor="etiqueta" weight="semibold">Etiqueta (opcional)</Label>
                    <Input
                      id="etiqueta"
                      value={etiqueta}
                      onChange={(e) => updateStateValue("etiqueta", e.target.value)}
                      placeholder=""
                      appearance="outline"
                    />
                  </div>
                  
                  {error && <Text className="error-text">{error}</Text>}
                </div>
              </div>
              
              <div className="button-container">
                <Button 
                  appearance="primary" 
                  onClick={agregarCalculo}
                  className="button"
                >
                  Calcular
                </Button>
              </div>
              
              <Button 
                appearance="transparent" 
                onClick={() => {
                  alert(`
Cómo se calcula el Impuesto a las Donaciones:

1. Se determina el valor UTM/UTA según la fecha seleccionada.

2. Se calcula la base imponible según el parentesco:
   - Para cónyuge, padres e hijos: Se resta 60 UTM (5 UTA) al monto donado
   - Para hermanos, medio hermanos, sobrinos, nietos, primos y tíos abuelos: Se resta 60 UTM (5 UTA)
   - Para parentesco más lejano y extraños: No hay deducción

3. Si la base imponible es negativa o cero, no hay impuesto a pagar.

4. Se determina la tasa según el tramo donde cae la donación:
   - Hasta 960 UTM: 1%
   - Más de 960 hasta 1.920 UTM: 2,5%
   - Más de 1.920 hasta 3.840 UTM: 5%
   - Más de 3.840 hasta 5.760 UTM: 7,5%
   - Más de 5.760 hasta 7.680 UTM: 10%
   - Más de 7.680 hasta 9.600 UTM: 15%
   - Más de 9.600 hasta 14.400 UTM: 20%
   - Más de 14.400 UTM: 25%

5. Se aplica la fórmula: Base imponible × Tasa - Rebaja

6. Se calcula el recargo según el parentesco:
   - Hermanos, medio hermanos, sobrinos, nietos, primos y tíos abuelos: 20%
   - Parentesco más lejano y extraños: 50%
   - Cónyuge, padres e hijos: No hay recargo

7. El impuesto final es: Impuesto base + Recargo
                  `);
                }}
                className="info-button"
              >
                <span style={{fontSize: '16px'}}>ⓘ</span> ¿Cómo se calcula el impuesto?
              </Button>
            </Card>
          </div>
          
          {/* Panel derecho: Tabla de referencia (si está activada) */}
          {mostrarTablaReferencia && renderTablaReferencia()}
        </div>
        
        {/* Sección de resultados */}
        <div className="results-section">
          <Card className="card">
            <h3 className="card-title">Resultados</h3>
            
            <div className="table-container">
              {calculosRealizados.length > 0 ? (
                <div style={{overflowX: 'auto', width: '100%'}}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="table-header celda-etiqueta">Etiqueta</th>
                        <th className="table-header celda-donacion">Monto Donación</th>
                        <th className="table-header celda-parentesco">Parentesco</th>
                        <th className="table-header" style={{minWidth: '140px'}}>Deducción Inicial</th>
                        <th className="table-header celda-base-imp">Base Imponible</th>
                        <th className="table-header celda-factor">Tasa</th>
                        <th className="table-header celda-impuesto-base">Impuesto Base</th>
                        <th className="table-header celda-recargo">Recargo</th>
                        <th className="table-header celda-resultado-final" style={{fontWeight: 'bold'}}>
                          Impuesto Final
                        </th>
                        <th className="table-header celda-accion">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculosRealizados.map((calculo) => (
                        <tr key={calculo.id}>
                          <td className="table-cell celda-etiqueta">
                            <div style={{width: '100%', textAlign: 'center'}}>
                              <span 
                                className={getCeldaStyle(calculo.id, 'etiqueta')}
                                onClick={() => toggleExpansion(calculo.id, 'etiqueta')}
                                title={`${calculo.etiqueta} (${calculo.fecha})`}
                              >
                                {calculo.etiqueta}
                              </span>
                            </div>
                          </td>
                          <td className="table-cell celda-donacion money-cell-base">
                            {formatearMoneda(calculo.montoDonacion)}
                          </td>
                          <td className="table-cell celda-parentesco">
                            {calculo.parentesco.label}
                          </td>
                          <td className="table-cell money-cell-base">
                            {calculo.deduccionInicial > 0 ? (
                              <div>
                                <div>{formatearMoneda(calculo.deduccionInicial)}</div>
                                <div style={{fontSize: '10px', color: '#666'}}>
                                  ({calculo.deduccionInicialUTM} UTM)
                                </div>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="table-cell celda-base-imp money-cell-base">
                            {calculo.exento ? "Exento" : formatearMoneda(calculo.baseImponible)}
                          </td>
                          <td className="table-cell celda-factor">
                            {calculo.exento ? "-" : formatearFactor(calculo.tasaAplicable)}
                          </td>
                          <td className="table-cell celda-impuesto-base money-cell-base">
                            {calculo.exento ? "-" : formatearImpuestoPreciso(calculo.impuestoBase)}
                          </td>
                          <td className="table-cell celda-recargo money-cell-base">
                            {calculo.exento ? "-" : formatearImpuestoPreciso(calculo.recargo)}
                          </td>
                          <td className="table-cell money-cell-base celda-resultado-final">
                            <div style={{width: '100%'}}>
                              <span 
                                className={`${getCeldaStyle(calculo.id, 'impuestoFinal')} ${calculo.exento ? 'texto-exento' : 'texto-pago'}`}
                                onClick={() => toggleExpansion(calculo.id, 'impuestoFinal')}
                              >
                                {calculo.exento ? "Exento" : formatearImpuestoPreciso(calculo.impuestoFinal)}
                                {!calculo.exento && (
                                  <span className="indicador-resultado indicador-pago">
                                    A PAGAR
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="table-cell celda-accion">
                            <Button 
                              appearance="subtle"
                              onClick={() => eliminarCalculo(calculo.id)}
                              aria-label="Eliminar cálculo"
                              icon={<span>✕</span>}
                              style={{minWidth: 'auto', height: '24px', padding: '0 8px'}}
                            >
                              <span style={{fontSize: '11px'}}>Eliminar</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <Text>No hay cálculos realizados. Ingrese los datos de la donación para comenzar.</Text>
                </div>
              )}
            </div>
            
            {calculosRealizados.length > 0 && (
              <div className="footer-action">
                <Button 
                  appearance="outline"
                  onClick={limpiarCalculos}
                  style={{
                    borderColor: '#0078d4',
                    color: '#0078d4',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                >
                  Limpiar Todo
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}