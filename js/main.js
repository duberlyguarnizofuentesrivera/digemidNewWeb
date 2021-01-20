$(function () {
    const spinner_div = $("#spinner_div")
    const search_glass = $("#svg_search_img")
    const show_results_button = $("#show_results_button")
    const suggestion_list = $("#suggestions_list");
    const search_form = $("#search_form");
    // const slow_network_warning = $("#slow_network_div");
    const slow_network_div = "<div id=\"slow_network_div\" class=\"alert alert-warning\" role=\"alert\">\n" +
        "                Red lenta o problemas de conexión!\n" +
        "                <button type=\"button\" class=\"close\" data-dismiss=\"alert\" data-bs-dismiss=\"alert\" aria-label=\"Cerrar\">\n" +
        "                    <span aria-hidden=\"true\">&times;</span>\n" +
        "                </button>\n" +
        "            </div>"
    show_results_button.hide()
    spinner_div.hide()

    // slow_network_warning.hide()
    function titleCase(str) {
        return str.replace(
            /\w\S*/g,
            function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    }

    $("#search_box").on("paste keyup", function () {
        const text = $(this).val();
        if (this.value.length < 3) {
            suggestion_list.empty();
            suggestion_list.append("<li>Ingresa un medicamento...</li>");
        } else {

            const search_results = request(text)
                .then(result => result.json())
                .then(element => processResults(element));
        }
    });

    const request = async (text) => {
        search_glass.hide()
        spinner_div.show()
        show_results_button.hide()
        const t1 = performance.now();
        const response = await fetch("https://cors-anywhere.herokuapp.com/http://observatorio.digemid.minsa.gob.pe/default.aspx/GetMedicamentos", {
            headers: {
                "Content-Type": " application/json"
            },
            body: JSON.stringify({"term": text}),
            method: "POST"
        });
        if (!response.ok)
            throw new Error("Error with request");
        //const data = await response.json();
        spinner_div.hide()
        search_glass.show()
        const t2 = performance.now();
        if (t2 - t1 > 1000) {
            console.log("SLOW NETWORK!")
            //todo: verificar que solo se muestre una vez, y no una vez para cada carácter
            search_form.prepend(slow_network_div)
            // slow_network_warning.show()
        }
        return response;
    }

    function processResults(element) {
        //console.log("processing results");
        let number_of_elements = 0;
        suggestion_list.empty();
        for (let el in element.d) {
            number_of_elements = number_of_elements + 1;
            const listado_palabras_clave = ["Solucion", "Tableta", "Inyectable", "Crema"];
            let product_complete_name = element.d[el].value;
            let id_complete_string = element.d[el].id;
            let product_array = [product_complete_name, "(Sin Descripción)"];
            for (let keyword in listado_palabras_clave) {
                let keyword_found = product_complete_name.indexOf(listado_palabras_clave[keyword]);
                if (keyword_found !== -1) {
                    product_array = [product_complete_name.substring(0, keyword_found),
                        product_complete_name.substring(keyword_found)];
                }
            }

            const product_name = product_array[0];
            const product_type = product_array[1];

            if (number_of_elements < 6) {
                suggestion_list.append("<li data-id=\"" + id_complete_string + "\"><a href=\"#\">" + product_name + "<br/><span>" + product_type + "</span></a></li>");
            }
        }
    }

    async function getTableData(url) {
        console.log("getTableData Initialized")
        const response = await fetch(url, {
            headers: {
                "Content-Type": " application/json"
            },
            method: "GET"
        }).then(result => result.json()).then(data => populateTable(data));
    }

    /**
     *
     * @param list  Lista de listas retornadas por DIGEMID. La lista contiene los siguientes elementos:
     * @param list.aaData   listado de elementos individuales (registros de medicamentos coincidentes)
     */
    function populateTable(list) {
        console.log("populateTable started")
        //  todo: poner fecha de actualización natural (hace 3 dias, etc)
        for (let element in list.aaData) {
            let el = list.aaData[element]
            if (el[6].length >= 30) {
                let pharmacy_line_break = el[6].indexOf(" ", 29)
                el[6] = el[6].substring(0, pharmacy_line_break) + "<br>" + el[6].substring(pharmacy_line_break + 1)
                if (el[6].substring(0, 4) === "<br>") {
                    el[6] = el[6].substring(4)
                }
                console.log(el[6])
            }
            $("tbody").append("<tr><td>" + el[2].split(" ")[0] + "</td><td>" + el[3] + "</td><td>" + titleCase(el[4]) + "</td><td>" + titleCase(el[6]) + "</td><td>" + el[7] + "</td><td>Detalle</td></tr>")
        }
        show_results_button.show()
    }

    $("ul").on("mousedown", "a", function (event) {
        event.stopPropagation();
        let texto = $(this).text();
        let id_string = $(this).parent().attr("data-id");
        //todo: Considerar que DIGEMID bota server error si el primer valor no está presente... debes manejar ese error!
        let id_array = id_string.split("@");
        for (let el in id_array) {
            id_array[el] = id_array[el].replace(/ /g, "*");
        }
        $("#search_box").val(texto);
        let encoded_text = texto.replace(/ /g, "*");
        let url = "https://cors-anywhere.herokuapp.com/http://observatorio.digemid.minsa.gob.pe/Precios/ProcesoL/Consulta/data.aspx?grupo=" + id_array[0] + "&tipo_busqueda=3&totalPA=" + id_array[1] + "&relacionado=1&con=" + id_array[2] + "&ffs=" + id_array[3] + "&ubigeo=04&cad=" + encoded_text + "&_=1610425495843&sEcho=1&iColumns=9&sColumns=&iDisplayStart=0&iDisplayLength=150&sSearch=&bRegex=false&sSearch_0=&bRegex_0=false&bSearchable_0=true&sSearch_1=&bRegex_1=false&bSearchable_1=true&sSearch_2=&bRegex_2=false&bSearchable_2=true&sSearch_3=&bRegex_3=false&bSearchable_3=true&sSearch_4=&bRegex_4=false&bSearchable_4=true&sSearch_5=&bRegex_5=false&bSearchable_5=true&sSearch_6=&bRegex_6=false&bSearchable_6=true&sSearch_7=&bRegex_7=false&bSearchable_7=true&sSearch_8=&bRegex_8=false&bSearchable_8=true&iSortingCols=0&bSortable_0=false&bSortable_1=false&bSortable_2=false&bSortable_3=false&bSortable_4=false&bSortable_5=false&bSortable_6=false&bSortable_7=false&bSortable_8=true";
        getTableData(url).catch(error => console.log(error)); //Solo ejecuta la función, y si hay error lo envía a la consola. Asi no vemos más el warning de WebStorm
    });
});
