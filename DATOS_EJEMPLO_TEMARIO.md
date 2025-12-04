# Datos de Ejemplo - Temario Completo

## 📚 Curso: JavaScript Fundamentals

### Datos del Curso

```json
{
  "name": "JavaScript Fundamentals",
  "description": "Un curso completo sobre los fundamentos de JavaScript, desde variables hasta funciones avanzadas.",
  "code": "JS101"
}
```

---

## 📝 Temario (Topics) del Curso

### Tema 1: Variables y Tipos de Datos

**Nombre:** Variables y Tipos de Datos

**Contenido:**
```
Las variables en JavaScript son contenedores para almacenar valores de datos.

## Tipos de Variables:
- var (evitar en código moderno)
- let (recomendado - scope de bloque)
- const (recomendado - no se puede reasignar)

## Tipos de Datos Primitivos:
1. string - Texto entre comillas: "Hola", 'Mundo'
2. number - Números: 42, 3.14, -10
3. boolean - Verdadero/Falso: true, false
4. null - Representa ausencia intencional de valor
5. undefined - Variable declarada pero no asignada
6. symbol - Valor único e inmutable

## Typeof Operator:
typeof "Hola" // "string"
typeof 42 // "number"
typeof true // "boolean"
typeof undefined // "undefined"
typeof null // "object" (quirk histórico)

## Ejemplos:
const nombre = "Juan"; // string
const edad = 25; // number
const esEstudiante = true; // boolean
let ciudad; // undefined
```

**Actividades:**
```json
[
  {
    "type": "question",
    "text": "¿Cuál es la diferencia entre let y var?",
    "answer": "let tiene scope de bloque, var tiene scope de función"
  },
  {
    "type": "code",
    "text": "Escribe una variable const que almacene tu nombre"
  },
  {
    "type": "question",
    "text": "¿Qué devuelve typeof null?",
    "answer": "object (es un quirk histórico de JavaScript)"
  }
]
```

---

### Tema 2: Operadores y Expresiones

**Nombre:** Operadores y Expresiones

**Contenido:**
```
Los operadores permiten realizar operaciones sobre variables y valores.

## Operadores Aritméticos:
+ Suma: 5 + 3 = 8
- Resta: 10 - 4 = 6
* Multiplicación: 3 * 4 = 12
/ División: 20 / 4 = 5
% Módulo (residuo): 10 % 3 = 1
** Exponenciación: 2 ** 3 = 8

## Operadores de Asignación:
= Asignar: x = 5
+= Suma y asigna: x += 3 equivale a x = x + 3
-= Resta y asigna: x -= 2 equivale a x = x - 2
*= Multiplica y asigna: x *= 2
/= Divide y asigna: x /= 2

## Operadores de Comparación:
== Igual (compara valor): 5 == "5" es true
=== Idéntico (compara valor y tipo): 5 === "5" es false
!= No igual: 5 != 6 es true
!== No idéntico: 5 !== "5" es true
< Menor que: 3 < 5 es true
> Mayor que: 10 > 5 es true
<= Menor o igual: 5 <= 5 es true
>= Mayor o igual: 10 >= 8 es true

## Operadores Lógicos:
&& AND (Y): (true && false) es false
|| OR (O): (true || false) es true
! NOT (NO): !true es false

## Ejemplos:
let x = 10;
let y = 3;
console.log(x + y); // 13
console.log(x > y && y > 0); // true
console.log(x === "10"); // false
```

**Actividades:**
```json
[
  {
    "type": "code",
    "text": "Suma 5 + 3 y asigna el resultado a una variable"
  },
  {
    "type": "question",
    "text": "¿Cuál es la diferencia entre == y ===?",
    "answer": "== compara solo valor, === compara valor y tipo"
  },
  {
    "type": "code",
    "text": "Usa operadores lógicos: verdadero si x > 5 AND x < 20"
  }
]
```

---

### Tema 3: Funciones

**Nombre:** Funciones

**Contenido:**
```
Las funciones son bloques reutilizables de código.

## Declaración de Función:
function saludar(nombre) {
  return "Hola, " + nombre;
}

saludar("Juan"); // "Hola, Juan"

## Función con Múltiples Parámetros:
function sumar(a, b) {
  return a + b;
}

sumar(5, 3); // 8

## Función sin Retorno:
function mostrarMensaje() {
  console.log("Este es un mensaje");
}

## Arrow Functions (=>):
const multiplicar = (a, b) => a * b;
multiplicar(4, 5); // 20

const saludarArrow = (nombre) => {
  console.log("Hola " + nombre);
};

saludarArrow("María"); // Hola María

## Parámetros por Defecto:
function greet(nombre = "Amigo") {
  return "¡Hola, " + nombre + "!";
}

greet(); // "¡Hola, Amigo!"
greet("Carlos"); // "¡Hola, Carlos!"

## Scope y Closures:
const makeCounter = () => {
  let count = 0;
  return () => {
    count++;
    return count;
  };
};

const counter = makeCounter();
counter(); // 1
counter(); // 2
```

**Actividades:**
```json
[
  {
    "type": "code",
    "text": "Escribe una función que multiplique dos números"
  },
  {
    "type": "code",
    "text": "Convierte la función anterior a Arrow Function"
  },
  {
    "type": "question",
    "text": "¿Qué es un closure?",
    "answer": "Una función que tiene acceso a variables de su función padre"
  }
]
```

---

### Tema 4: Arrays (Arreglos)

**Nombre:** Arrays

**Contenido:**
```
Los arrays almacenan múltiples valores en una sola variable.

## Crear Arrays:
const numeros = [1, 2, 3, 4, 5];
const nombres = ["Juan", "María", "Carlos"];
const mixto = [1, "Texto", true, null];

## Acceder a Elementos:
const frutas = ["Manzana", "Plátano", "Naranja"];
console.log(frutas[0]); // "Manzana"
console.log(frutas[2]); // "Naranja"

## Métodos de Array:
- push(): Agregar elemento al final
- pop(): Eliminar último elemento
- shift(): Eliminar primer elemento
- unshift(): Agregar elemento al inicio
- length: Obtener cantidad de elementos
- slice(): Obtener parte del array
- splice(): Modificar contenido
- map(): Transformar cada elemento
- filter(): Filtrar elementos
- forEach(): Iterar sobre elementos

## Ejemplos:
const numeros = [1, 2, 3];

numeros.push(4); // [1, 2, 3, 4]
numeros.pop(); // [1, 2, 3]

const dobles = numeros.map(x => x * 2); // [2, 4, 6]

const pares = numeros.filter(x => x % 2 === 0); // [2]

numeros.forEach(x => console.log(x)); // Imprime 1, 2, 3

const suma = numeros.reduce((a, b) => a + b, 0); // 6
```

**Actividades:**
```json
[
  {
    "type": "code",
    "text": "Crea un array de 5 números y obtén el primero"
  },
  {
    "type": "code",
    "text": "Usa map() para multiplicar cada número por 2"
  },
  {
    "type": "code",
    "text": "Usa filter() para obtener solo números mayores a 5"
  }
]
```

---

## 🔧 Cómo Crear el Temario en la App

### Paso 1: Crear el Curso

1. Ve a `/admin/courses/new`
2. Llena el formulario:
   - **Name:** JavaScript Fundamentals
   - **Description:** Un curso completo sobre los fundamentos de JavaScript, desde variables hasta funciones avanzadas.
   - **Code:** JS101
3. Click "Crear Curso"

### Paso 2: Crear los Temas

Para cada tema (Variables, Operadores, Funciones, Arrays):

1. Ve a `/admin/courses` → Click en el curso → "Agregar Tema"
2. Llena:
   - **Name:** (del tema)
   - **Content:** (contenido detallado)
   - **Activities:** (actividades en JSON)
3. Click "Guardar Tema"

### Paso 3: Configurar Persona

1. Ve a `/admin/persona`
2. Selecciona "JavaScript Fundamentals"
3. Configura:
   - **Tone:** motivador
   - **Style:** detallado
   - **Level:** basico
   - **Language:** es
4. Click "Guardar"

### Paso 4: Inscribir un Alumno

1. Como alumno, ve a `/courses`
2. Click "Inscribirse a Curso"
3. Ingresa código: `JS101`
4. Click "Inscribirse"

### Paso 5: Probar el Chat

1. Ve a `/chat`
2. Selecciona "JavaScript Fundamentals"
3. Escribe: "¿Qué es una variable?"
4. El Docente debe responder con tono motivador y detallado

---

## 📊 JSON Completo para Importar (Si tu app lo soporta)

```json
{
  "course": {
    "name": "JavaScript Fundamentals",
    "description": "Un curso completo sobre los fundamentos de JavaScript",
    "code": "JS101"
  },
  "topics": [
    {
      "name": "Variables y Tipos de Datos",
      "content": "Las variables en JavaScript...",
      "activities": [
        {"type": "question", "text": "...", "answer": "..."}
      ]
    },
    {
      "name": "Operadores y Expresiones",
      "content": "Los operadores permiten...",
      "activities": []
    },
    {
      "name": "Funciones",
      "content": "Las funciones son bloques...",
      "activities": []
    },
    {
      "name": "Arrays",
      "content": "Los arrays almacenan...",
      "activities": []
    }
  ]
}
```

---

## 🧪 Frases de Prueba para el Chat

Después de crear el temario y configurar la Persona, prueba con estas frases:

1. **Primer mensaje (inicio):** "Hola, quiero aprender JavaScript"
   - Esperado: Docente inicia con explicación de Variables

2. **Pregunta sobre tema actual:** "¿Qué es typeof?"
   - Esperado: Docente explica typeof en contexto de Variables

3. **Demostración de comprensión:** "Entendí, let tiene scope de bloque y var tiene scope de función"
   - Esperado: Docente celebra y avanza a Operadores (o genera resumen en background)

4. **Pregunta fuera del tema:** "¿Cuál es la capital de Francia?"
   - Esperado: Docente redirige al tema actual

5. **Pedido de ejemplos:** "Dame un ejemplo de arrow function"
   - Esperado: Docente proporciona ejemplo detallado

---

## ✅ Verificación

**En Supabase, ejecuta:**

```sql
-- Ver curso creado
SELECT * FROM courses WHERE code = 'JS101';

-- Ver temas del curso
SELECT id, name FROM topics WHERE course_id = 'tu-course-id';

-- Ver configuración de persona
SELECT * FROM persona_configs WHERE course_id = 'tu-course-id';

-- Ver syllabus de un alumno
SELECT s.*, t.name as topic_name 
FROM student_syllabus s
JOIN topics t ON s.topic_id = t.id
WHERE s.student_id = 'alumno-id'
ORDER BY s.order_index;
```

---

**¡Ya tienes todo lo necesario para probar el sistema completo!** 🚀
