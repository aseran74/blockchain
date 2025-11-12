(function (global) {
  if (typeof global === 'undefined') {
    return;
  }

  /**
   * Inicializa el efecto Earth sobre un canvas dado.
   * Devuelve una función de limpieza para desmontar los handlers.
   */
  global.initEarthEffect = function initEarthEffect(target) {
    var doc = global.document;
    var canvas =
      typeof target === 'string' ? doc.querySelector(target) : target;

    if (!canvas) {
      console.warn('[earth-effect] Canvas no encontrado');
      return function () {};
    }

    if (!global.THREE) {
      console.warn('[earth-effect] THREE no está disponible');
      return function () {};
    }

    var THREE = global.THREE;

    var prevPointerDown = canvas.onpointerdown;
    var prevMouseDown = canvas.onmousedown;
    var prevTouchStart = canvas.ontouchstart;
    var prevPointerMove = global.onpointermove;
    var prevMouseMove = global.onmousemove;
    var prevTouchMove = global.ontouchmove;
    var prevPointerUp = global.onpointerup;
    var prevMouseUp = global.onmouseup;
    var prevTouchEnd = global.ontouchend;
    var prevTouchCancel = global.ontouchcancel;
    var prevBlur = global.onblur;

    var AMOUNT = 200,
      d = 25,
      R = 200,
      obliquity = (23 / 180) * 3.14,
      roV1 = 0.0022,
      roV2 = -0.0005,
      ro1 = 0,
      ro2 = 0,
      color = '#420236',
      fogC = '#722779',
      T_earth = 'https://mapplix.github.io/earth/earth.png';

    var camera, scene, renderer, particles, world;
    var dpr,
      lastW,
      W = global.innerWidth,
      H = global.innerHeight,
      aspect = W / H,
      vMin = Math.min(W, H);
    var mouseX = 0,
      mouseY = 0,
      x0,
      y0;
    var lookAt = new THREE.Vector3(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: canvas,
    });
    renderer.setSize(W, H);

    camera = new THREE.PerspectiveCamera(18, aspect, 1, 10000);
    scene = new THREE.Scene();

    var Emap = new THREE.TextureLoader().load(T_earth);
    Emap.anisotropy =
      Math.min(8, renderer.capabilities.getMaxAnisotropy()) || 1;

    var posZ = 1700;

    var Wmaterial = new THREE.MeshStandardMaterial({
      onBeforeCompile: function (sh) {
        sh.vertexShader =
          '#define MYSHADER\n' +
          'attribute float center, bright;\n' +
          'varying vec3 vCenter, vPos, vV0, vV1, vV2;\n' +
          'varying float vBright;\n' +
          sh.vertexShader.replace(/}\s*$/, function (match) {
            return (
              '	vBright=bright;\n' +
              '	int c=int(center);\n' +
              '	vCenter = vec3(c==0, c==1, c==2);\n' +
              '	vPos=position;\n' +
              '	gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos, 1.0);\n' +
              '	vV0=vCenter[0]*vPos;\n' +
              '	vV1=vCenter[1]*vPos;\n' +
              '	vV2=vCenter[2]*vPos;\n' +
              match
            );
          });

        sh.fragmentShader =
          '#define MYSHADER\n' +
          'varying vec3 vCenter, vPos, vV0, vV1, vV2;\n' +
          'varying float vBright;\n' +
          sh.fragmentShader
            .replace(
              '#include <alphamap_fragment>',
              '#include <alphamap_fragment>\n' +
                '	vec3 d = fwidth( vCenter );\n' +
                '	vec3 a3 = smoothstep( vec3(0.0), d * 1.4, vCenter+0.4*d-1.0/fogDepth );\n' +
                '	float scale = dot(normalize(vViewPosition), vNormal);\n' +
                '	scale = 1.0-scale*scale;\n' +
                '	float dist = distance(vPos, vV0.xyz/vCenter.x);\n' +
                '	dist = min(dist, distance(vPos, vV1.xyz/vCenter.y));\n' +
                '	dist = min(dist, distance(vPos, vV2.xyz/vCenter.z));\n' +
                '	float b3 = smoothstep(1.5, 1.8, dist-1.5*scale*scale );\n' +
                '	float edgeFactorTri=min(b3,min( min( a3.x, a3.y ), a3.z ));\n' +
                '	diffuseColor.a *= mix( 1.0,  0.0, edgeFactorTri );\n' +
                '	float dissipation=' +
                (posZ + 0.5 * R + 0.01) +
                ';\n' +
                '	diffuseColor.a *= smoothstep( 20.0,  0.0, fogDepth-dissipation );\n'
            )
            .replace(
              '#include <fog_fragment>',
              '	float lVc=length(vCenter);\n' +
                '	gl_FragColor.rgb *= smoothstep( ' +
                R * 0.8888 +
                ', ' +
                R * 1.201 +
                ', fogDepth );\n' +
                '	gl_FragColor.rgb = mix( gl_FragColor.rgb, vec3(3.0), (.1*lVc+pow(lVc,8.0))*vBright );\n' +
                '	#include <fog_fragment>\n'
            );
      },
      roughness: 0.5,
      metalness: 0.964,
      envMapIntensity: 5,
      emissive: 0,
      transparent: true,
      alphaTest: 0.05,
    });
    Wmaterial.color.set(fogC);
    Wmaterial.side = 2;
    Wmaterial.extensions = { derivatives: 1 };

    var geometry = new THREE.IcosahedronGeometry(R, 3);
    for (var i = 0; i < geometry.vertices.length; i++) {
      geometry.vertices[i].applyEuler(
        new THREE.Euler(
          Math.random() * 0.06,
          Math.random() * 0.06,
          Math.random() * 0.06
        )
      );
    }

    var bGeometry = new THREE.BufferGeometry();
    bGeometry.fromGeometry(geometry);

    var position = bGeometry.attributes.position;
    var centers = new Int8Array(position.count);
    var brights = new Float32Array(position.count);

    var points = [],
      activePoints = [],
      vCount = geometry.vertices.length,
      dCount = 0,
      dMid = 0;

    for (var k = 0, l = position.count; k < l; k++) {
      var c = (centers[k] = k % 3);
      brights[k] = 0;
      if (k < vCount) {
        points[k] = {
          siblings: [],
          distances: [],
          indexes: [],
          brightness: 0,
          v: 0,
          a: 0,
          f: 0,
          dr: 0,
          r: 1,
        };
      }
    }

    function addSiblings(a, b, one) {
      if (points[a].siblings.indexOf(points[b]) < 0) {
        points[a].pos = geometry.vertices[a].clone();
        points[a].siblings.push(points[b]);
        var dist = geometry.vertices[a].distanceTo(geometry.vertices[b]);
        points[a].distances.push(dist);
        dMid += dist;
        dCount++;
      }
      if (!one) addSiblings(b, a, 1);
    }

    geometry.faces.forEach(function (face, idx) {
      addSiblings(face.a, face.b);
      addSiblings(face.a, face.c);
      addSiblings(face.c, face.b);
      points[face.a].indexes.push(idx * 3);
      points[face.b].indexes.push(idx * 3 + 1);
      points[face.c].indexes.push(idx * 3 + 2);
    });

    dMid /= dCount || 1;
    var ttl = 10;

    (function setActive(n) {
      if (!n) return;
      var idx = parseInt(Math.random() * vCount, 10);
      if (geometry.vertices[idx].z < -100) setActive(n);
      else {
        points[idx].isActive = ttl;
        activePoints.push(points[idx]);
      }
      setActive(n - 1);
    })(10);

    bGeometry.addAttribute('center', new THREE.BufferAttribute(centers, 1));
    bGeometry.addAttribute('bright', new THREE.BufferAttribute(brights, 1));

    var Ematerial = Wmaterial.clone();
    Ematerial.alphaMap = Emap;
    Ematerial.transparent = false;
    Ematerial.side = 0;

    var cubeCamera = new THREE.CubeCamera(1, 2 * R, 256);
    cubeCamera.position.z = 0.47 * R;
    Ematerial.envMap = cubeCamera.renderTarget.texture;
    Ematerial.envMap.minFilter = THREE.LinearMipMapLinearFilter;
    Ematerial.envMap.mapping = THREE.CubeReflectionMapping;

    var Earth = new THREE.Mesh(
      new THREE.IcosahedronGeometry(R * 0.77, 3),
      Ematerial
    );

    particles = new THREE.Group();
    world = new THREE.Group();

    var Net = new THREE.Mesh(bGeometry, Wmaterial);
    particles.add(Net, Earth);
    world.add(particles);
    scene.add(world);

    scene.fog = new THREE.Fog(fogC, posZ - R / 2, posZ + R);
    var hLight = new THREE.HemisphereLight('#fff', 0, 23);
    world.add(hLight);
    hLight.position.set(0, 0, 1);

    var dx = 0,
      dy = 0,
      active,
      abc = ['a', 'b', 'c'],
      movedPoints = [],
      activeF = [],
      ready,
      raycaster = new THREE.Raycaster(),
      mouse = new THREE.Vector2();

    function interact() {
      mouse.x = (x0 / W) * 2 - 1;
      mouse.y = -(y0 / H) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      movedPoints.forEach(function (point) {
        point.f = 0;
      });
      activeF = [];
      if (!active) return;
      var inters = raycaster.intersectObject(Net)[0];
      var ind, vert;
      if (!inters) return;
      var point = Net.worldToLocal(inters.point.clone());
      for (var i = 0; i < 3; i++) {
        ind = inters.face[abc[i]];
        var found = points.some(function (p, idx) {
          if (p.indexes.indexOf(ind) >= 0) {
            vert = idx;
            return true;
          }
          return false;
        });
        if (!found) return;
        activeF[vert] = Math.max(
          1 - point.distanceTo(points[vert].pos) / dMid,
          0
        );
      }
    }

    canvas.onpointerdown = canvas.onmousedown = canvas.ontouchstart =
      function (e) {
        active = e.changedTouches ? e.changedTouches[0] : e;
        x0 = active.clientX;
        y0 = active.clientY;
        e.preventDefault();
        interact();
      };

    global.onpointermove = global.onmousemove = global.ontouchmove = function (
      e
    ) {
      if (!active || !ready) return;
      if (!e.buttons) {
        active = false;
        return;
      }
      var touches = e.changedTouches;
      if (active.identifier !== undefined && e.type !== 'touchmove') return;
      if (touches) {
        if (touches[0].identifier === active.identifier) e = touches[0];
        else return;
      } else {
        e.preventDefault();
      }
      dx = (5 * dx + x0 - (x0 = e.clientX)) / 6;
      dy = (5 * dy + y0 - (y0 = e.clientY)) / 6;
      interact();
      ready = 0;
    };

    global.onmouseup =
      global.onpointerup =
      global.ontouchend =
      global.ontouchcancel =
      global.onpointercancel =
      global.onblur =
        function () {
          active = false;
          interact();
        };

    var t0 = new Date() * 1,
      dMax = 80,
      dMin = 1000 / 33,
      dT = 1000 / 50,
      posArr = bGeometry.attributes.position.array,
      animationId = 0;

    function animate() {
      animationId = global.requestAnimationFrame(animate);

      var t = new Date() * 1,
        dt = t - t0;
      if (dt < dMin) return;
      dt = Math.min(dt, dMax);
      t0 = t;
      var dd = dt / dT;

      var pos = canvas.getBoundingClientRect();
      if (pos.bottom <= 0 || pos.top >= global.innerHeight) return;

      if (
        dpr !== (dpr = global.devicePixelRatio) ||
        W !== (W = global.innerWidth) ||
        H !== (H = global.innerHeight)
      ) {
        vMin = Math.min(W, H);
        renderer.setSize(W, H);
        renderer.setPixelRatio(dpr);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
      }

      activePoints.slice().forEach(function (point) {
        var b = point.brightness;
        if (point.isActive && (b += (point.speed || 0.3) * (b + 0.05) * dd) > 1) {
          point.siblings.forEach(function (s, j) {
            if (activePoints.indexOf(s) > -1) return;
            s.speed = 3.7 / point.distances[j];
            if ((s.isActive = Math.random() > 0.6)) activePoints.push(s);
          });
          point.isActive = 0;
        } else if (!point.isActive && (b -= b * 0.056 * dd) < 0.005) {
          b = 0;
          activePoints.splice(activePoints.indexOf(point), 1);
        }
        point.brightness = b;
        point.indexes.forEach(function (idx) {
          brights[idx] = b;
        });
      });

      points.forEach(function (point, idx) {
        var dSum = 0;
        point.siblings.forEach(function (s) {
          dSum += s.dr;
        });
        dSum = dSum / point.siblings.length - point.dr;
        point.f =
          -(activeF[idx] || 0) * 0.4 +
          dSum * 400 -
          point.dr * 1 * (1 + Math.abs(1 - point.r)) -
          point.v * 1000;
        point.v += (point.f * dt) / 3000000;
        point.r = 1 + point.dr;
        point.indexes.forEach(function (idx2) {
          var j = idx2 * 3;
          posArr[j] = point.r * point.pos.x;
          posArr[j + 1] = point.r * point.pos.y;
          posArr[j + 2] = point.r * point.pos.z;
        });
      });

      points.forEach(function (point) {
        if (!point.v) return;
        var ddLocal = point.v * dt;
        point.dr += ddLocal;
      });

      bGeometry.attributes.bright.needsUpdate = true;
      bGeometry.attributes.position.needsUpdate = true;

      camera.position.z += (posZ - camera.position.z) * 0.085 * dd;
      ro1 += roV1 * dd;
      ro2 += roV2 * dd;
      particles.rotation.set(0, 0, 0);
      particles.rotateY(ro2).rotateX(obliquity).rotateY(ro1);
      particles.rotation.y -= 0.0009;
      dx *= 1 - 0.03 * dd;
      dy *= 1 - 0.03 * dd;
      ro2 -= dx * 0.002;
      world.rotation.x -= dy * 0.002;
      world.rotation.x *= 0.92;

      Net.applyMatrix(
        new THREE.Matrix4()
          .getInverse(particles.matrixWorld)
          .multiply(
            new THREE.Matrix4().makeRotationFromEuler(
              new THREE.Euler(-dy * 0.003, -dx * 0.002, 0)
            )
          )
          .multiply(particles.matrixWorld)
      );

      Earth.visible = false;
      scene.scale.set(0.33, 0.33, 0.65);
      cubeCamera.update(renderer, scene);
      Earth.visible = true;
      scene.scale.set(1, 1, 1);
      particles.matrixWorldNeedsUpdate = true;
      renderer.render(scene, camera);
      ready = 1;
    }

    animate();

    return function dispose() {
      global.cancelAnimationFrame(animationId);
      canvas.onpointerdown = prevPointerDown;
      canvas.onmousedown = prevMouseDown;
      canvas.ontouchstart = prevTouchStart;
      global.onpointermove = prevPointerMove;
      global.onmousemove = prevMouseMove;
      global.ontouchmove = prevTouchMove;
      global.onpointerup = prevPointerUp;
      global.onmouseup = prevMouseUp;
      global.ontouchend = prevTouchEnd;
      global.ontouchcancel = prevTouchCancel;
      global.onblur = prevBlur;
      if (renderer && renderer.dispose) {
        renderer.dispose();
      }
    };
  };
})(typeof window !== 'undefined' ? window : undefined);


