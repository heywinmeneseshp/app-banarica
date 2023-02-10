import { Document, Page, View, Text, StyleSheet, Image, Svg } from "@react-pdf/renderer";

export default function MovimientoPDF({ move }) {



    const styles = StyleSheet.create({
        page: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            marginTop: "30px",
            marginBottom: "30px",
            alignItems: "center",
            backgroundColor: "white",
            fontSize: "11"
        },
        head: { display: "flex", flexDirection: "row", width: "85%", alignItems: "center" },
        company: { textAlign: 'center', width: "60%", fontSize: "10" },
        companyName: { fontSize: move.comercializadora == "C.I. BANACHICA S.A.S. ZOMAC." ? "18" : "13", fontStyle: "bold", marginBottom: "10px" },
        movimiento: { textAlign: "left", width: "40%", marginLeft: "30px" },
        movChild: { display: "flex", flexDirection: "row", borderBottom: "1px solid #AEB6BF", paddingBottom: "8px", paddingTop: "8px" },
        movChildEnd: { display: "flex", flexDirection: "row", paddingBottom: "8px", paddingTop: "8px" },
        movTag: { fontWeight: "bold", width: "50%" },

        logoContainter: { display: "flex", textAlign: "center", width: "100%", justifyContent: "center" },
        logo: {
            height: "100px",
            width: "180px",
            marginBottom: "10px",
            textAlign: "center",
            margin: "auto",
            paddingBottom: "10px"
        },

        agua: {
            width: "80%",
            position: "absolute",
            paddingTop: "110px"

        },
        imagen: {
            opacity: "0.5"
        },

        table: { marginTop: "30px" },
        tableHead: { display: "flex", flexDirection: "row", width: "85%", borderBottom: "2px solid #AEB6BF", paddingBottom: "5px", paddingRight: "5px", paddingLeft: "5px" },
        tableBody: { display: "flex", fontSize: "9", flexDirection: "row", width: "85%", borderBottom: "1px solid #AEB6BF", paddingBottom: "6px", paddingTop: "6px", paddingRight: "5px", paddingLeft: "5px" },
        almacen: { width: "15%" },
        cod: { width: "20%", textAlign: "center" },
        articulo: { width: "45%" },
        cantidad: { width: "20%", textAlign: "right" },

        approvedContainer: { display: "flex", flexDirection: "row", justifyContent: "flex-end", textAlign: "left", width: "85%", marginBottom: "30px", marginTop: "30px" },
        left: { width: "30%" },
        right: { width: "70%" },
        aprobado: { display: "flex", width: "100%", flexDirection: "row", border: "1px solid #AEB6BF", paddingBottom: "8px", paddingTop: "8px", paddingRight: "30px", paddingLeft: "30px", marginTop: "10px" },
        aproTag: { marginRight: "10px", width: "120px", textAlign: "left" },
        user: { textAlign: "center", width: "100%" },
        noApproved: { textAlign: "center", width: "100%", color: "red" },

        observaciones: { borderTop: "2px solid #AEB6BF", width: "85%", paddingLeft: "5px", paddingRight: "5px", fontSize: "10" },
        obChild: { display: "flex", flexDirection: "row", marginTop: "5px", marginBottom: "5px" },
        obChildTag: { marginRight: "5px" }


    });

    return (

        <Document>
            <Page size="A4"
                style={styles.page} >

                {false &&
                    <View style={styles.agua}>
                        <Image
                            style={styles.imagen}
                            src="https://cdn.streamelements.com/uploads/badfc17d-0f9e-40e8-be04-d8470d5464fc.png"
                        />
                    </View>
                }

                <View style={styles.head}>

                    <View style={styles.company}>

                        {(move.comercializadora != "C.I. BANACHICA S.A.S. ZOMAC.") &&
                            <View style={styles.logoContainter}>
                               
                                <Image style={styles.logo} 
                                src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIbGNtcwIQAABtbnRyUkdCIFhZWiAH4gADABQACQAOAB1hY3NwTVNGVAAAAABzYXdzY3RybAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWhhbmSdkQA9QICwPUB0LIGepSKOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAF9jcHJ0AAABDAAAAAx3dHB0AAABGAAAABRyWFlaAAABLAAAABRnWFlaAAABQAAAABRiWFlaAAABVAAAABRyVFJDAAABaAAAAGBnVFJDAAABaAAAAGBiVFJDAAABaAAAAGBkZXNjAAAAAAAAAAV1UkdCAAAAAAAAAAAAAAAAdGV4dAAAAABDQzAAWFlaIAAAAAAAAPNUAAEAAAABFslYWVogAAAAAAAAb6AAADjyAAADj1hZWiAAAAAAAABilgAAt4kAABjaWFlaIAAAAAAAACSgAAAPhQAAtsRjdXJ2AAAAAAAAACoAAAB8APgBnAJ1A4MEyQZOCBIKGAxiDvQRzxT2GGocLiBDJKwpai5+M+s5sz/WRldNNlR2XBdkHWyGdVZ+jYgskjacq6eMstu+mcrH12Xkd/H5////2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGiEcFxgfGRQUHScdHyIjJSUlFhwpLCgkKyEkJST/2wBDAQYGBgkICREJCREkGBQYJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCT/wAARCACcATEDASIAAhEBAxEB/8QAHAABAAIDAQEBAAAAAAAAAAAAAAYHAwQFAQII/8QAUBAAAQMDAgMFBAQHCQ8FAAAAAQIDBAAFEQYhBxIxE0FRYXEUIoGRFaGxshYjMkJSotFic5KzwcLD0uMXJCUzNDZDRUZTcnSCk/AmY4Oj0//EABkBAQADAQEAAAAAAAAAAAAAAAACAwQBBf/EADMRAAEEAAQDBwIGAwEBAAAAAAEAAgMRBBIhMRNBURRhcYGRobEy0SIjM0JS8DRTwWLh/9oADAMBAAIRAxEAPwD9U0pSiJUX1bruNpl9qCzFcnXB4BSGEHGAdgScHrjoB8qlFVjdZsfTfFNy5XVpaYshlIZeKchB5Ep5vmCPLPnWXFyujYC01Zq+nes+Jkcxoy6Wd+i6jF94hSkdojT1vaSdwl5RCvlz/wAlervHEZH+oLWr0c/tKmMObFuDCX4j7b7Sui21BQPyrPXBASLEh9vsghJ1Dz7fZQI6g4ij/ZuAfRX9pXn4RcRTt+DUL5/2lT+ld7O7/Yfb7JwHfzPt9lAk37iMr/ZyB8VY/pK+heeJB/1Bax6r/tKnVfK3m2hlxxKB4qOKdnd/sPt9lzgnm8+32UJFz4kq/wBT2ZP/AFH/APShuHEnutdn9AT/AF6m6VpWAUqCge8HNfVOzn+Z/vku8A/zKr569cS4/vGx25weCN/6SvG+KE62YRqLTkuL4usg4PoFYH6xqwsV8OstvIKHEJWhWxSoZBrnZ5Bq2Q+dFc4Lxq1589VzbFqm0ajbKrdLQ4tIytpXuuI9Unf49K6tQDVHDZsq+lNNkwZ7J5w02rlSsj9H9E+m1dLh/rFeo4rkOeA3c4mzqccvaJ6c2O452I7j64pHO4P4coo8uhXY5XB2SQa+xUtpSla1oSlKURKUpREpSlESlKURKUpREpSlESlKURKUpREpSlESlKURKUpREpSlEStO6We33uN7PcYjUlvqAsbpPiD1B8xW5SuEAiiuEA6FVJe7bK4X32LcLY+6u1yV4Wyo5xjqk+O2SD128t7YbWlxtK07pUAR6GoLxmTnTMU+ExP8Wupbp9ZcsVvWdyqM2f1RWLDt4cz427aFZYRklcwbaFdClKVuWteE4BNVNabGeJOoLvIuc+S3HiOcjTbRGQCVAAZyBsnfbfNWyrofSq54Q/5ZqL9/b+1ysOJAfLHG7Y37BZJwHSMYdjfwtW8aRu2gUfTGnLhJfis+8/HdOdu8kDYp8dgR1z1xPdO3tnUNnj3FkcodHvI70KGxHzrovsokMOMuJCkOJKFJPQgjBFV7wYkqctE+Oo+62+FD4pH7KNbwJgxn0uvTvCNaIZQ1uzvkKxaUpW5a15VbXmMiwcU7VNY/Ft3A8qwNgVKyg/PKT61ZVVxr9xMjXOl4qfy0PoWrHcC6n+qax436A7mCPlZcX9IPMEfKselKVsWpKUpREpSlESlKURKUpREpSlESlKURKUpREpSlESlKURKUpREpSlESlKURKUpRFA+Mv+bEb/nUfcXUq03/AJvW3/lWvuiopxmONMRf+dT/ABblS3T45bFbx4Rm/uisbP8AJf4BZW/ru8AuhSlK2LUvD0NVxwi/y3UX7839rlWPjaq5Ng1RpG/XCbp6JHnRJx5i24rHIc53HMOmTg56GseIsPZJVgX7hZZwQ9j60FqwZkxi3xHpclwNssoK1qPcBUG4PQ1M2SZLIITIkHkyOoSMfbkfCsE3TusNaOtN31yPa4CCCpiOrJUfHGTk+p28Knlut0e1QWYUVsNsMpCEp8q43NLKJCKAvfnaNuSQPqgFtUpStq1LWnT49tiOy5bqWmWk8y1K7hVeaMiyNX6wk6rktFERglEcK7zjCR8AST5kVrTVSdf64fssyWYluhKUexBwXOUgbeKjnr3DNWdBgxrbEaiRGUssNJ5UIT0A/wDO+sDbxEmb9rT6n/4sYud9/tafUrPSlK3rYlKUoiUpSiJSlKIlKUoiUpSiJSlKIlKUoiUpSiJSlKIlKUoiUpSiJSlKIlKUoir/AI0KxpyGnxmA/wD1rqa2lHZ2uGjwZQP1RUH4znNptrX6Uk/dI/lqfx0dmw2j9FIH1Vjj1xD/AACyx/rv8AslKUrYtSV4pQG5IHrQ7Amqqt1ukcS9Q3Rc64yGIEJzkQwycbEqAxnIH5OScVnmmLCGtFkqmWUsIAFkq1EqSrooH417UBlcK/YWu20/ep8WWjcdq5lK/IlIGPkfStvRWrJ0yY/Yb812N1jDOSAO1SPTbPTcbEHNRbO4ODZW1e3MKImIcGyCr2U0pSlaloUY1Lw/tGpXFSHULjyyMdu0cE+GR0NRYXDU3DaQhFwUu62RSuUOZypHoTuk+RyD3Yq0KwyorM2O5HkNpdacBStChkEGssmFBOeP8Luv3WeTDgnMzQ/3dY7Xc4l4gtToTodYdGUqHd4gjuI8K2qrC0qe4ea1FnK1rtFyUOyyc8ilHCT6g7HxBBPSp3qDUlu0zD9pnu8uchtpO63D4Afy9K7DiA5hL9CN12Ka2kv0I3XUpVbquWttVIMuMpqwWvlKg44cKKfHJGfiOUVHG4+n7pOTFuOsLnKcUrlDq0KDZPkVE/PpVL8cBWVu/U0qnYuth66K66VXP9yuXbMv2LUMqM91AVsFepSR9hrbsGs7pbbs3YNWNJbkLwGZaRhLpPTONt+mRjfYirW4kggSty35j1VgnINSNr4U7pXG1Lqy3aWjB2YtSnV/4phvdbn7B5mot+EOutSD/BNpatUZXR6RurH/AFD+bU5MSxhy7noNVJ87WnLuegVhUqtZ+gL/ACYUiXdNTSn3kNqWllrmKSoDIAycfIVx9P8AELUcy3osUNoy7k6ohqW4vKkI26jG+N/eJqh2NyOqRpF7c7VRxeU09pF7K4qVXjPDK5yE9rcNUz1SVbq7NSiAfUnJ+qtO4wdYaCbM6JdV3WA2cuNv5VyjzBJIHmkipHFPaMz2ED1UjO5otzDSs+lc3Tt9j6jtDFyjgoDgIU2TkoUNik/H6sVH9UcQk22b9E2WKbldCeUpTkobV4HG5I7wMY7z3Ve6djWB5OhVrpWNbnJ0UypVU3lnUxjCbqjUptDCzhMeNkqV+55UYz8zWDT+k9PaoLjcTUNxckNjmUhxIQrHjg9R8aynGuLsrWepA9ln7US7K1vqQFbtKrZekNVaTHtNgvLk1lvcxHuih3gJJIPwwakmi9aM6qZdadZ9lnx/8cxv06ZGe7Pd3VdHiLdkeKP92VrJ7dkeKKktKUrSr0pSlESlKURKUpREpSlEVc8WSX7jp2En/SPqJHqpsD7TVige6PSq61gDO4mafhj3g0hDpHh7yifqQKsXpWODWWR3eB6BZodZHu7/AIC9pSlbFpXivyT6VXPCIf31qE/++j7XKsZXQ+lV9wrR2Fy1KwrZaJSQR5czlY5v14/P4WaUfnM8/hWFVe65H0XrrTd1bUUqfV2CwO8BQB+pz6qsKq/4jJTN1NpaE2cvB8uFI7k8yN/1T8q7jf0r52PlMV+nfOx8qwB0pQdBSta0pSmaZoirrjG32UG2TkHleZkFKVeGU5/misfEi0TUX63ahEA3CDGQhLzKdynlUpRyMdDnruNt/P3iw59JTrLYmVfjX3gojwyQlJ+s/Kt3V+qLvKvqNMaa5UyinMh/G7ecHAPdgHJO53GN68ibKXSX/wCa8V5suUukvu9VGLxrSRrl5qzsrj2e3qIL7sl5KcpHiSQMfuR1+zd1nE0hC0cIlolW16U0tBQtp1C3nN8KJKd+hJ8Pqrp27hHaIbBeu0p+U4BzOFKuzQO89N/rqGyJ1qDjs21aQQ/bIzgSuQ+t1QPqc4GdtjnrvWd4lY0mard6gdwHRUPEjWni1bv7yVw6becf0/bXXcla4zalE9SeUVDuMjKU2u3y0+681IwlQ6jKSftSKm9omtXK1xJjCORp5pK0o/RBHT4VDOMqSbBEIHSUPuKr0cULwx8FuxI/IPgt3Xemjd7c1fWJCo1wtzBfSQMhQSObHkQQcHz+W7oDUMjUlgTKlhPtDThaWUjAVjBzju2IrpX0p/Bi4lJBT7E7gg7EdmajHB5ONMvHxlL+6mukZcQK5jXyQjLOK5jVTh1xLLa3FnCUgqJ8AKqi0Oaq1S5Ou2nTbrbHS6UcqW0pW4QM4J5SScEdSBk1Zt6OLRN/eF/dNRDgynGlpB8Zqz+oiuYhueVkd0NTokzc8jWE6arf4e6qk6jgyGp6QmbDWEOYGOYHocdx2PyqTy46JUV5hxIUhxCkqB7wRioDw/aMbWmqWeiQ8SB5dorH1GrDV0PpU8K5zovxanUKeHcXR/i71XfBh9Qt90hnozISv+EMfzK5hnP8OtSXiVOtLsxM1wrYlj3RgkqKc4xncZHlWzwslM2xzVD0lwNsx1oUtR/NALua+UG/8UnHfxxttiQvlCQMlzHj+kfqHqKwNNwRhv1i69wsINwsDfqF0ufZ3GNcX36Z1NcoEWHHVytQ3H0p5+/lAJzy+J7+npvrdtzXFa3qsi4ymXWsO+zY5OYpXke7t3JNZr9o7SejLQZsyNInOFQQ2hbxT2iuv5uABsTnFaOjLnHtWp4sSVppi3OzUZZcBWXEpUDg+8TscEd1QDXMc1klXYJOpPwuAFpax9XYJPNWzjaq4tYRA4wzmmgEpkMHIHiUJWfrFWPVZZLXGpAPRacD/sH9lehi9DGf/QWzE7sPeFZ1KUrataUpSiJSlKIlKj151K7H1Fb9OwkoTLlpLqnnUFaG0ALPQKBJJQe8YroW03hMuU1cjEcYSlBYejtlvnJ5uYKSVKwRhPrn4CAkBNBQDwTQXRrmag1Hb9NQjLuDpSDkIbSMrcPgkfy9B31ybhqK5xtdwLA0YnskpntiotKLiQAslOebG/J1xtnvxvGWorWpOJs6JfCXW4aVGNHXskgEEbd+xz5+lZ5sSQKZvda9VTLPQpm90smiI83VGrJWrZjCmI4BSwkknfHLgeiRufE1ZVfLbaG0JQ2lKEJGAEjAAr6qyCHhtomydSVZFHw21uea9pSmavVqVXN0t950bqyRf7XAXcIEwHt2W/ygTudgD3jIOD1IqxaVTNCJANaI1BVUkYeBrRCr88Sb1MQpq36Sm+0HZJc5ihJ8T7o+0VtaQ0lck3RzUWo3e1uTgIbbzkNA+m3TYAbAVNsD40qtuHJcHSOuvRQEBJDpHXS9pTIpkVqWheVp3a6xLLAdnTHQ2y0nJJ7/ACHiTW5mqx4hab1XdpRkhLUyAyeZuMwogpHiU/nH0Ppis+JldGwua2yqZ5HMZbRZWzoe2ydU39/WFybKWgophtny2z6AZHqSe6vnTckWziXfI1xw29MUTHWrbmTzZSAfNOP4Nd/RWsbdfYyYCGBb5kZPIYZ2AA293xHl1H11tat0dD1XHQHFmNLZ3ZkoGVJ8iO8VmbDcbXxGyDfiefgs7Yrja6M2Qb8TzXYmRkzIj0ZRIS6hSCR4EYqolWLVdjs87TpjxUW6Q8HHJrjiUpA90Z5idh7o2xmpJG01xDhJLTOo4S2xskukrVj4oJ+s1je0FNnKErWOpQ4w2c9khXI38zgD+D8ajO101U0gjwA13UZg6SiGkHyCl+mPYkWSJHgS2ZbUdpLXaNKCgSBg9Kw6vssO+2N+LNfEZsfjA8cYbI3zv3VAZNpYsVyckaS1jaIjL35Ud+WkhPgM+9zfHceJrdiaUvesveu+q4kuE2sBTcBwOJV4g4AAOO8g13jOc3hZLO24pS4pc3h5LPjouBbeIUuHaZun3UG5MraXGiOp91YBHKNt8jB2HXuqxOHdmkWTTDEeWjs31qU6tB6pydgfPGK8unDqxzrUiFFjogusjLMloe+k+JPVXxPyrio0pr+JlEXU8ZxsbJL2SceeUK+2oRRTQuBeM1ChXJQjjlidb/xdK5KdzI4lxHmCcdqhSM+oxVaaJ1TC0VCuNkvQcYkxnlOJwkq7X3QMDwzgYJ2Oa3zpfiHJ92RqWK2g9S0o5+pA+2tuJwmtXYvqucqVcJjycKkKVy8qv0gN9/8AiJqchmkeHxtojqpvMr3BzG0R1WvwriypBu19ltls3F7nRnvGSokeWVYHpU/PTFV01ojWtoxHtGpGDERs2HiQUjwxyqx86yL03xGWMHUkIehI/o67A98TAwsPt912J7o2BhYfZRXUKZmjpV+tj0btI95wtp4HoAsq/nEEeh9Z7wwuMaZpSNHZKQ7G5m3Ud4PMTn45+2tazcOXVTm7jqa5Kuz7Y91leVNJ9ebqO/GBXl54buJuP0lpmf8ARD6hhbSAUtn0x0Hlgj0qqGCaN/FA05DnW/yqoopY3cQDTpzrdbvEbTEnU1mbbhYMmO52iEKOAsYIIz47/VUUgNXKTq+Bd9VriWsRW0ttpcdSkukZAwOY96iSenhXbXp/iEtotHUkED9IIwr58lfMfhJEfQ+7ebpKnzHgMPA8vZn4k83x7q7JE+R+drCPEitNl2SNz352tPntop4lSVAFJBHcRVccU7XGiOsahYuKodxRhtttP5TpB6jfIIBO9bMXSGt7S0Ylu1JGMVHut9sglQT8UnHzNZbPw1ccuP0lqe4G6vpPutHJb+Oeo8sAetWzcSZnDyUep5KyXPK3Jkr/AIpLpSXPnadgSrmMS3W+Zfu4yCTynHmMGutSlbmimgWtjRQASlKVJdSlKURcXUGkrfqJ2PIfXIjS4xy3Jir5HUjwzg7d/l3Yyc+o0zyWqRbzebysvkEylSvxyMEHCVYwBtvtvk12aVDhtsurUqGRtk1uuAvR0dd8g3lVwuCpUJpLLfMpBCkgEHmynJKuZWTnO+2Nq1tY6LGoeymwX/YrrH/xUgEjmHgojcevdUopUXQMc0tI3XHQsILSN1BWbRxHabCDe7QrAxzKBJ/i6+V2TiQ4d9QWxI/cp/s6nlKq7K3+R9Sq+zjqfVV8rTXERXXUsMem39HXn4K8QD11Qx8Cf6lWFSnY2dT6lOzN6n1Kr4aT171OqWQfjj7tfR05xBabUpGpYzikgkJ5R7x7huip/SnY2dT6lOzN6n1Ki/D3Uj2pbCH5RBksrLTigMc+wIVgeIIqT1XHBUn6NuSe4PJP6tWRXcG8vha526YV5fE1xUV4i6hlad0/20JQRIedS0lZGeTIJJx44FRmTA1/p2Cbyq7omIaSHHY6lFeE432Ixgd+CK3OM7n+B4DY/OkE/JJ/bUx1Lyo01dASAPY3hv8A8BrPI3iSPskZQK91S8Z5H6kUAvNN3pvUNljXFtPJ2qfeR+ioHBHzFdMioZwmbWjSKCsEBb7hTnwzj7Qamea14d5fE1x3IWmFxdG1xVfcTbKILbGp7cOwnRHUc60jHMM4BPocD0Jqd2+SZsCNKKQkvNIcKR3ZAOPrqI8V7i1F0suIVDtpbiUITncgEKJ+r6xUqs7Ko9phMrBCm47aCD1BCQKpiAE7w3ah66quMATOA6D1XG17qKXpyyoegoQqTIfTHQpe4QSFHmx3/k/X8K58ThszNdTM1NcJN3l96SspaR5ADfHyHlXe1RpyNqi0rgSFFs8wW06BktrHQ47+pGPOo+W9d2aG4t+7WB5lpOzkrmScDpkgAZ9T8a5M38y5G23l/wBsKMrfx28WP7yXbRojTaG+zFlhEfumwT8zvUWm2iPprX1m+gB2ftnMiXEbX7obGPeI8MEkZ2ymovL4iX2Y8Gpd5TEj5wswGQVfAnH3hUk0TetFt3RpERE5V0kEpEqanmW4o9dwSBnx29ayieGZwDAG0RroPRUCaKVwDABRGu3orIpSleuvSSlR29cQNPWPKXpqZDwOCzGw4oeu+B8SK4392OwHpDuh/wDiR/Xqh2KiaaLgqXYiNpouCndKh9u4raanu9mt5+GScAyG8JPxSSB8cVLWJDMplD7DrbzSxlK0KCkqHiCOtTjlZJ9BtTZI1/0m190pWCZPiW5kvzJLMZobc7qwkfM1MmtSpk1qVnpUPncVtMw1lDb8iWR/uGtvmrGa1DxjsKdzBuuPHsm8ffrOcXCP3BUHExD9wU7pUdsev9P39SWo8wMvq2DMgciifAdxPkCakVXMka8W02Fa17XC2m0pSlTUkpSlESlKURKUpREpSlESlKURKUpREpSlEVbcFf8AILn+/J+7Vk1W/BXJt1yJ73k/dqyKx4D/AB2rLgv0WqL680m7qu3MtR30MyI7naIK88qtsEHG49a4j+jNXahSiNqC/texpOVIYSMr9cJSD8c46139d6le0vYzLjIQt9xwNN8+6QTk5PjsDUWOqdcWCM1dLxCjyravlKloKQUhXTodviMVTiOCJDmB76281VNws5zX31t5qw7bb49qgswoqA2wykIQnyrlay1ONK2gzQwX3FrDTaM4HMQTknw2NdS23CPdYLE2KvnZeQFpPl5+dLla4l3iLhzo6H2F9Uq+0HuNbXAmOozWmi1uBLPyzXRQnSdgmannM6q1BIafI3ixmlAob8CcZxjw6569MVYNVreNHXHRaV3nS058Nte+9EcPMFJHXb84Y7jv4GprpfUDWprKxcW0hClZS42DnkWOo/l9CKz4UhhMbhTt+t96ow5ykxuFO38e9cTiNqW4WCPBZty2WHJrimzIcGQ0Bjffbv6nOwrSi8NmrpyS77e5d2WRkcrmGx6dTj0xUvvFkgX6GqHcI6XmjuM7FB8Qe41CuGxctl8vtgS+47FiOfigs7j3lA+W+2ahMy5hxNWnbuPgoyM/NGfUHbu8lKIOi9PW4D2e0xQR+ctHOr5qyai+ro7UbXelkstIbBcOQlIH5yasKoDrU/8Ar3S374fvJqeKja2MZRWo+VLEMa1gocx8qdyJDMRhyRIcS002kqWtRwEgd5quX5t54mSnY1vcXbrC0rlW9+c/+306DvztW9xXlPuxLZZI6ilVykcqvMJIwD5ZUD8KmFptke0W6PBioCGmUBI8/EnzJ3rslzSGLZo37+5dfcrzHyG/euRZ9B2Cytjs4LTziRu8+AtR899h8MV4rW2lI8j2T6SiJUDy+6PcB/4gMfXXP4rXN+36YLbCygynQypQ6hOCSPjjHxrNA4fWRzS7EF2Cx7QuOOaTyDtQ4RkkK67Hu6Y2qJLmvMULRoFwkhxZEBoutcNM2O+M5kQIzyVjIcQkBWPEKG9QW4wLnwumN3C2yHJVmdcCXYzivySf/NlDwGfPf4b6ibt8WRp+7yER5UF1SEB5YGU5/JBPgc/AinErU0CbavoO3uomzJTiAEMHn5cKB6jvJGMVTK+N8XGGjh630VUj43RcUaO/70XZ1Rrli0W2IqA2ZU64oSuI1jqFYwo/Mbd/zrkw+Hyp/wDhTWNwdlvhPMprtOVtodSMju9MD1r6vWibo9atPybcppN1tTLTakLPuqwB3+RB9QTUd1VeNQzJjNmv86Ba4rg5niwef3e/mAJUfTYGozvIcTM2xpQ5efn1XJnkG5Rpy6ea3Yl9ky5jzGidLwnYsbZT7iACvzySOvcMknrUw0jqBnVVtcW9ESxKYWWZDChnlV8a51n1lojT9tbgwrklLTQ/3LnMtXeT7u5NcvhI67Ll36byqDL7yVJJHVRKiR64I+dShdlka0OBu7Aqh4LsTsr2tDru7rYLvah4dWW+NLU3HRClEZS8wnl38wNjWhw8vtxE2dpm8OF2XA3bcJyVIBAIz39UkE74PlU4qt0qLXGgBB5Q40QoDv8AxJP8gq6ZoikY9mlmj32rZWiN7Xt0s0VZNKUrctaUpSiJSlKIlKUoiUpSiJSlKIlKUoiVjlSWYUZ6VIXyMsoU44rBPKkDJO3kKyVWeo9RXrV95maVsbaWI7ai1IeUrClBJKVZOdkZ2wMk48CRVM8wibfM7eKqmlEYvmdls8GWSixzXSMBcnl+SR+2rCrlaZsDOm7OxbmVc/Z5K14xzqO5OO6ut3VHDRmOJrDuFyBhZGGlQLjGgq03GUOiZSc/wVVJ029m8aWbgvAFuRDSjcdMoGD6g4PwrDrHTx1NYn4CFpQ6SFtKV0CgcjP2fGuBozU91j3VvSt9hpbktNfiXk499KRtnGx2B3Hh0qk0yc5xo4AefRVEhsxzbOoLHwjmuC2TrQ/lL0F8+4fzQrqP4QVU/qt5TidHcTfaHPxcG7o95XRKVk75/wCoZ9FVY4OdwalgzTDGd2mvspYY03IdxovFoC0lKgCkjBB76r/hri1X3UNiz7jL3atJ/c5IJ+RRVhVAdQ6dv1q1MrUunENSFuo5X46jjm2APhkbA9Qciu4gEObKBdHXwKTggtkA2+FPqrnRRP8AdF1L4cy/4ytu38WbWu2PPXJpcWcySn2VIKi4R4HGBv1z0r64c2uaZFz1BcY/sztyc522yCCE5Jzv45+qq3Ssmkj4Zvn7c1B0rZXsyG+anNV/rbbXulf33+emp/UJ4i2q4rdtt9tTIfkW1ZWW8Z5k5Bzjv3G4G+9W4wEx2ORHyrMULj05V8rW4jOpi6n0rJdOGkvqyT3e8j9tT8HYVXlycRxS0gp2G12Nzguc/Yk/nY3SD4KHTzA8K6egtaN3uKm3Tl9ldI45FoXsXMd48/EeNVRStEpN6Ooj0pVxyASE8nahb+urAvUenX4rO8hBDrIJ6qT3fEZHxrmcPNYsXKA1Z5y+wucRPZFDmxdSnYEZ7wBuPjU0qOag0DZdROF+SwpmQerzB5VK9e4/EVbJE8P4sW+xHVWSRuD+IzfmFsXnRmnrzIM25W9tboHvOBam8jxVykZ9TWhppvRDFyUxY/YPbkZGxKl+fKpXX4HpXOZ4RWhKvx0+4vN/oFwAH5Co7rC2wLbqC0W/SbHZ3RpWT2J5iDty82c79Sc93Xas0r3R1IYwNfM+GiokeWfmFgHypFq3U9yuV4/BbTauWUR/fMkHHZDvAPdgdT13AG9Z7NwqskBAXPSu4yDupThIRnySP5c1xuHin4WtL3Eu6km5uDmKsAc55iVEdNjkH0qzanh2NnuWQWbOh5KULRNcj9dduirbUE2LFvI0/pnTNulzkJ5nFLYTyo2zju7sbk43ArscP9SSLqZtsmwWIcqAsJWhlPKnqQRjfBBB6VxLpGvOjtbS77CtTtzjTUFOG85STykg4BIwU+G4NdXh1Z7gzIut7uccxnri7zpZUMFI5iSSO7c7Z8KqiL+PXebFaVyVcZdxa7zpyrkpvVbOAo40s5/PbJH/AGFfsqyag3ECxusPN6qgXBEKZBbOVLTkLG+APPcjBG+a1Yxpyhw/aQfRaMSDlDuhBU6pUM0nrUr0uxcdRPhtx2QphpaWiVSOmCEoG++RsO6pRbLtDu7TrkNxagy4WXAtpTakLABIKVAEHcd1XRzMeAQd1ayVrwCDutulaV3vVvsUUSrlJTHZKwgKIJyognGACe41uIWlxCVoUFJUMgg5BFWWLpTsXS9pSldXUpSlESlKURKUpREpSlESoLfOHk36bdvmnLmIMt08623AeUqP5RyM7Hrgg7/ITqlVSwtlFOVckTZBTlBmpHEiKnlcgWuZj84LCSf1h9lff0zxB6fgxD9fakf16m1KrGHI0Dz7fZQ4B5PPt9lA37nxJdBDVigM57+2Qoj5rrY0tpG7t31WoNRymZEwN8jKG9+zzse4AbEjAz1NTSlBhRmDnOJrqgw4sOcSa6rkao0zE1TbFQ5PuLHvNPAZU0rx8x4jvqHxpeu9JYhvW36aiI91t1olSseGRv8AMfGrHpXZMOHuzgkHuXXwhxzA0e5Qj8O7/j/Mm559VY+5WjJv+u77zRbfYVWxKxgvPZBSPEFWB8gTVi0qJw73aOkPsomF50Lz7KtnuEKGrOhcaYpV5bPa9qT+LWrry4PTHcfntsM7d94iQGwmVp5iTy/nNqGT/BUfsqwqVzsTG6xkt8FzsrWm2EjwVfq1vq9PXRsjPlzn+bWP6d4g3pJaiWJq3BR5S6/sU+fvEfYasSlOzOO8h9vsu8Bx3efZRzROkjpWC8l6R7RLlKDj6x+TkZwB8zvWvqnh7B1A97dFdVb7kk8wkNDZZHTmHj5jf1qV0q3s8eTh1opmFhZkI0VdtzOIenfxUiAzeWU7B1s5Uflg/NPxrYVrnVHJj8CpvN45Vj7tTylVdmcNGyGvI/8AFDgOH0vPsoEpHEDUIDaxFsUZY95QPM7j5kg/Ku7pjRVu0wVvNFyTNdGHJLxypXjjw+3xJqQUqbMO1pzHU96k2BoOY6nvUX1bosX19q52+SYN2jj8W+Oi8dArv+PnuDXFRqzW1qV7PcdLuTlp/wBLGCsK8/dCh9npVhUrj8OC4uYSCVx0FnM00VX/AOEeuL4CzbtO/RgOxel5HJ54UB9hrUe4c6kiFN2i6gU/dke+pCshKj4BRO48iAPSrLpUTgw79RxJ9K9FE4YO+sk/3uVfI1vq5lrs3tHSnHxsVoC+Unxxyn7a129Nan11IakakWLfbUnmTEbGFn4dx81b+VWTShwmbSRxI6J2e9HuJHRQ/W2nYcq2QYqbfPLUVKgw7AAWuOrACQUE5Uk95G45R45rV01J1bYtOvSLtClXR0upSxH5wX0oJPMpR3JG4wNyPIdJ1SpnDjPxGmipmEZ84NFQzVtvuGqbkq0swUJixmVK7eY2vsnHFAAFBT+ckE9e8nbasvDSRdRZVW67QpUdcMhDS32ynnbPQDPXlxj0xUupXRABJxb1QQgP4l6pSlKvVy//2Q==" />

                              
                            </View>
                        }

                        <Text style={styles.companyName}>{move.comercializadora}</Text>
                        <Text>{move.direccion}</Text>
                        <Text>{move.tel}</Text>
                        <Text>{move.correo}</Text>
                    </View>

                    <View style={styles.movimiento}>
                        <View style={styles.movChild}>
                            <Text style={styles.movTag}>Movimiento:</Text>
                            <Text>{move.movimiento}</Text>
                        </View>
                        <View style={styles.movChild}>
                            <Text style={styles.movTag}>Fecha:</Text>
                            <Text>{move.fecha}</Text>
                        </View>
                        <View style={styles.movChild}>
                            <Text style={styles.movTag}>Semana:</Text>
                            <Text>{move.cons_semana}</Text>
                        </View>
                        <View style={styles.movChildEnd}>
                            <Text style={styles.movTag}>Consecutivo:</Text>
                            <Text>{move.consecutivo}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHead}>
                        <Text style={styles.almacen}>Almacén</Text>
                        <Text style={styles.cod}>Cod</Text>
                        <Text style={styles.articulo}>Artículo</Text>
                        <Text style={styles.cantidad}>Cantidad</Text>
                    </View>
                    {move.historial_movimientos.map((item, index) => {
                        return (
                            <View key={index} style={styles.tableBody}>
                                <Text style={styles.almacen}>{item.cons_almacen_gestor}</Text>
                                <Text style={styles.cod}>{item.cons_producto}</Text>
                                <Text style={styles.articulo}>{item.Producto.name}</Text>
                                <Text style={styles.cantidad}>{item.cantidad}</Text>
                            </View>
                        );
                    })


                    }
                </View>


                <View style={styles.approvedContainer}>
                    <View style={styles.left} >

                    </View>
                    <View style={styles.right}>
                        <View style={styles.aprobado}>
                            <Text style={styles.aproTag}>Realizado por:</Text>
                            <Text style={styles.user}>{move.realizado.nombre + " " + move.realizado.apellido}</Text>
                        </View>
                        {(move.historial_movimientos[0].cons_lista_movimientos == "DV" || move.historial_movimientos[0].cons_lista_movimientos == "LQ") &&
                            <View style={styles.aprobado}>
                                <Text style={styles.aproTag}>Aprobado por:</Text>
                                <Text style={move.aprobado ? styles.user : styles.noApproved}>{move.aprobado ? move.aprobado.nombre + " " + move.aprobado.apellido : "Pendiente por aprobación"}</Text>
                            </View>
                        }
                    </View>
                </View>

                <View style={styles.observaciones}>
                    <View style={styles.obChild}>
                        <Text style={styles.obChildTag}>Observaciones:</Text>
                        <Text>{move.observaciones}</Text>
                    </View>
                    {move.respuesta &&
                        <View style={styles.obChild}>
                            <Text style={styles.obChildTag}>Respuesta:</Text>
                            <Text>{move.respuesta}</Text>
                        </View>
                    }
                </View>
            </Page>

        </Document>
    );
}
